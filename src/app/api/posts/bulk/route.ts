import { NextRequest } from 'next/server';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';
import { publishPost } from '@/lib/ayrshare';

const MAX_BULK_POST_ITEMS = 400;
const BULK_POST_RATE_LIMIT = 10;
const BULK_POST_RATE_WINDOW_MS = 60_000;

const bulkSchema = z.object({
  timeZone: z.string().min(1),
  items: z.array(z.object({
    platform: z.string().min(1),
    caption: z.string().min(1).max(4000),
    hashtags: z.string().optional(),
    mediaUrls: z.array(z.string()).optional(),
    scheduledLocalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    scheduledLocalTime: z.string().regex(/^\d{2}:\d{2}$/),
  })).min(1).max(MAX_BULK_POST_ITEMS),
});

const PLATFORM_MAP: Record<string, string> = {
  google: 'gmb',
  x: 'twitter',
};

function toAyrsharePlatform(platform: string): string {
  const normalizedPlatform = platform.trim().toLowerCase();
  return PLATFORM_MAP[normalizedPlatform] ?? normalizedPlatform;
}

function toAbsoluteUrl(url: string, origin: string): string {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';
  if (/^https?:\/\//i.test(trimmedUrl)) return trimmedUrl;
  const baseOrigin = (process.env.NEXT_PUBLIC_APP_URL?.trim() || origin).replace(/\/$/, '');
  const normalizedPath = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
  return `${baseOrigin}${normalizedPath}`;
}

function toUtcIsoDate(date: string, time: string, zone: string): string | null {
  const localDateTime = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone });
  if (!localDateTime.isValid) return null;
  return localDateTime.toUTC().toISO();
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  if (!rateLimit(`posts:bulk:${user.sub}`, { limit: BULK_POST_RATE_LIMIT, windowMs: BULK_POST_RATE_WINDOW_MS })) {
    return errorResponse('Too many requests. Please wait a moment.', 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { timeZone, items } = parsed.data;
  const zoneProbe = DateTime.now().setZone(timeZone);
  if (!zoneProbe.isValid) {
    return errorResponse('Invalid time zone', 400);
  }

  const origin = new URL(req.url).origin;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { profileKey: true },
  });

  let created = 0;
  let scheduled = 0;
  let failed = 0;
  const failures: Array<{ index: number; platform: string; reason: string; postId?: string }> = [];

  for (const [index, item] of items.entries()) {
    const scheduledAtIso = toUtcIsoDate(item.scheduledLocalDate, item.scheduledLocalTime, timeZone);
    if (!scheduledAtIso) {
      failed += 1;
      failures.push({ index, platform: item.platform, reason: 'Invalid local schedule date/time' });
      continue;
    }

    const scheduledAtDate = new Date(scheduledAtIso);
    const shouldScheduleForFuture = scheduledAtDate.getTime() > Date.now();
    const mappedPlatform = toAyrsharePlatform(item.platform);
    const absoluteMediaUrls = (item.mediaUrls ?? [])
      .map(url => toAbsoluteUrl(url, origin))
      .filter(Boolean);

    const post = await prisma.post.create({
      data: {
        userId: user.sub,
        platform: item.platform,
        caption: item.caption,
        hashtags: item.hashtags ?? null,
        mediaUrls: item.mediaUrls?.length ? JSON.stringify(item.mediaUrls) : null,
        scheduledAt: scheduledAtDate,
        status: shouldScheduleForFuture ? 'Scheduled' : 'Published',
      },
    });
    created += 1;

    if (!dbUser?.profileKey) {
      failed += 1;
      failures.push({ index, platform: item.platform, reason: 'No connected Ayrshare profile found for this user.', postId: post.id });
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'Failed' },
      });
      continue;
    }

    const fullCaption = item.hashtags
      ? `${item.caption}\n\n${item.hashtags}`
      : item.caption;

    const result = await publishPost({
      post: fullCaption,
      platforms: [mappedPlatform],
      mediaUrls: absoluteMediaUrls.length > 0 ? absoluteMediaUrls : undefined,
      scheduleDate: shouldScheduleForFuture ? scheduledAtIso : undefined,
      profileKey: dbUser.profileKey,
    });

    if (result?.id) {
      scheduled += 1;
      await prisma.post.update({
        where: { id: post.id },
        data: {
          ayrshareId: result.id,
          status: shouldScheduleForFuture ? 'Scheduled' : 'Published',
        },
      });
    } else {
      failed += 1;
      failures.push({ index, platform: item.platform, reason: 'Failed to publish with Ayrshare', postId: post.id });
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'Failed' },
      });
    }
  }

  return Response.json({
    created,
    scheduled,
    failed,
    failures,
  });
}

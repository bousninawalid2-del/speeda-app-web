import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';
import { publishPost } from '@/lib/ayrshare';
import { serializePrisma } from '@/lib/serialize';

// ─── Validation ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  platform:    z.string().min(1),           // comma-separated: "instagram,facebook"
  caption:     z.string().min(1).max(4000),
  hashtags:    z.string().optional(),
  mediaUrls:   z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  status:      z.enum(['Draft', 'Scheduled', 'Published']).optional(),
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

async function markPostFailed(postId: string) {
  return prisma.post.update({
    where: { id: postId },
    data: { status: 'Failed' },
  });
}

// ─── GET /api/posts ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') ?? undefined;
  const status   = searchParams.get('status')   ?? undefined;
  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
  const limit    = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const skip     = (page - 1) * limit;

  const where = {
    userId: user.sub,
    ...(platform ? { platform: { contains: platform } } : {}),
    ...(status   ? { status } : {}),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return Response.json(serializePrisma({
    posts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
}

// ─── POST /api/posts ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  if (!rateLimit(`posts:${user.sub}`, { limit: 30, windowMs: 60_000 })) {
    return errorResponse('Too many requests. Please wait a moment.', 429);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { platform, caption, hashtags, mediaUrls, scheduledAt, status } = parsed.data;
  const origin = new URL(req.url).origin;

  const platforms = platform.split(',').map(p => p.trim()).filter(Boolean);
  const mappedPlatforms = platforms.map(toAyrsharePlatform);
  const absoluteMediaUrls = mediaUrls
    ?.map(url => url.trim())
    .filter(Boolean)
    .map(url => toAbsoluteUrl(url, origin));
  const resolvedStatus = status ?? (scheduledAt ? 'Scheduled' : 'Draft');
  let publishError: string | null = null;

  // Build full caption with hashtags
  const fullCaption = hashtags
    ? `${caption}\n\n${hashtags}`
    : caption;

  // Save to DB first
  let post = await prisma.post.create({
    data: {
      userId:      user.sub,
      platform,
      caption,
      hashtags:    hashtags ?? null,
      mediaUrls:   mediaUrls ? JSON.stringify(mediaUrls) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status:      resolvedStatus,
    },
  });

  // Publish or schedule via Ayrshare if not Draft
  if (resolvedStatus !== 'Draft') {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { profileKey: true },
    });

    if (dbUser?.profileKey) {
      const result = await publishPost({
        post: fullCaption,
        platforms: mappedPlatforms,
        mediaUrls: absoluteMediaUrls ?? undefined,
        scheduleDate: scheduledAt ?? undefined,
        profileKey: dbUser.profileKey,
      });

      if (result?.id) {
        post = await prisma.post.update({
          where: { id: post.id },
          data: {
            ayrshareId: result.id,
            status: scheduledAt ? 'Scheduled' : 'Published',
          },
        });
      } else {
        if (result === null) {
          console.error('[api/posts] publishPost returned null', {
            platforms: mappedPlatforms,
            scheduleDate: scheduledAt ?? null,
            mediaUrls: absoluteMediaUrls ?? [],
          });
        }
        post = await markPostFailed(post.id);
      }
    } else {
      publishError = 'No connected Ayrshare profile found for this user.';
      post = await markPostFailed(post.id);
    }
  }

  return Response.json(
    serializePrisma(publishError ? { post, publishError } : { post }),
    { status: 201 },
  );
}

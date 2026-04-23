import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { AyrshareError, addFeed, deleteFeed, listFeeds, updateFeed } from '@/lib/ayrshare';
import {
  invalidateSettingsCache,
  resolveProfileKey,
  settingsCacheKey,
  withSettingsCache,
} from '@/lib/ayrshare-settings';

const postSchema = z.object({
  url: z.string().url(),
  platforms: z.array(z.string().min(1)).optional(),
  useFirstImage: z.boolean().optional(),
  autoHashtag: z.boolean().optional(),
});

const putSchema = z.object({
  id: z.string().min(1),
  useFirstImage: z.boolean().optional(),
  autoHashtag: z.boolean().optional(),
  platforms: z.array(z.string().min(1)).optional(),
});

const deleteSchema = z.object({ id: z.string().min(1) });

function handleError(err: unknown) {
  if (err instanceof AyrshareError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  return NextResponse.json({ error: 'Ayrshare unavailable', code: 'provider_error' }, { status: 503 });
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;
  try {
    const profileKey = await resolveProfileKey(userId);
    const feeds = await withSettingsCache(
      settingsCacheKey(userId, 'rss-feeds'),
      () => listFeeds(profileKey),
    );
    return NextResponse.json({ feeds });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;
  try {
    const parsed = postSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);
    const profileKey = await resolveProfileKey(userId);
    const feed = await addFeed({ ...parsed.data, profileKey });
    invalidateSettingsCache(userId, 'rss-feeds');
    return NextResponse.json({ feed });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;
  try {
    const parsed = putSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);
    const profileKey = await resolveProfileKey(userId);
    const feed = await updateFeed({ ...parsed.data, profileKey });
    invalidateSettingsCache(userId, 'rss-feeds');
    return NextResponse.json({ feed });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;
  try {
    const parsed = deleteSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);
    const profileKey = await resolveProfileKey(userId);
    await deleteFeed({ id: parsed.data.id, profileKey });
    invalidateSettingsCache(userId, 'rss-feeds');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

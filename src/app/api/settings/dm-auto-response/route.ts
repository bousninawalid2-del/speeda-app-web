import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { AyrshareError, getAutoResponse, setAutoResponse } from '@/lib/ayrshare';
import {
  invalidateSettingsCache,
  resolveProfileKey,
  settingsCacheKey,
  withSettingsCache,
} from '@/lib/ayrshare-settings';

const putSchema = z.object({
  autoResponseActive: z.boolean(),
  autoResponseMessage: z.string().optional(),
  autoResponseWaitSeconds: z.number().int().min(0).optional(),
});

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
    const data = await withSettingsCache(
      settingsCacheKey(userId, 'dm-auto-response'),
      () => getAutoResponse(profileKey),
    );
    return NextResponse.json(data);
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
    const data = await setAutoResponse({ ...parsed.data, profileKey });
    invalidateSettingsCache(userId, 'dm-auto-response');
    return NextResponse.json(data);
  } catch (err) {
    return handleError(err);
  }
}

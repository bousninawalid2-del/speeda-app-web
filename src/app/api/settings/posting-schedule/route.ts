import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { AyrshareError, deleteAutoSchedule, listAutoSchedules, setAutoSchedule } from '@/lib/ayrshare';
import {
  invalidateSettingsCache,
  resolveProfileKey,
  settingsCacheKey,
  withSettingsCache,
} from '@/lib/ayrshare-settings';

const postSchema = z.object({
  title: z.string().min(1),
  schedule: z.array(z.string().min(1)).min(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  excludeDates: z.array(z.string()).optional(),
});

const deleteSchema = z.object({ title: z.string().min(1) });

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
    const schedules = await withSettingsCache(
      settingsCacheKey(userId, 'posting-schedule'),
      () => listAutoSchedules(profileKey),
    );
    return NextResponse.json({ schedules });
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
    const result = await setAutoSchedule({ ...parsed.data, profileKey });
    invalidateSettingsCache(userId, 'posting-schedule');
    return NextResponse.json({ result });
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
    await deleteAutoSchedule({ title: parsed.data.title, profileKey });
    invalidateSettingsCache(userId, 'posting-schedule');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

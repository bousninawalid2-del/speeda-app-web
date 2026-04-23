import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { AyrshareError, getUserProfile, type AyrshareDisplayName } from '@/lib/ayrshare';
import { resolveProfileKey, settingsCacheKey, withSettingsCache } from '@/lib/ayrshare-settings';

const PLATFORMS = [
  'instagram', 'tiktok', 'snapchat', 'facebook', 'x', 'twitter',
  'youtube', 'google', 'gmb', 'linkedin', 'pinterest', 'threads',
] as const;

function normalize(platform: string): string {
  const p = platform.toLowerCase();
  if (p === 'twitter') return 'x';
  if (p === 'gmb' || p === 'googlebusiness' || p === 'google_business') return 'google';
  return p;
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  try {
    const profileKey = await resolveProfileKey(userId);
    const profile = await withSettingsCache(
      settingsCacheKey(userId, 'connected-platforms'),
      () => getUserProfile(profileKey),
    );

    const active = new Set((profile.activeSocialAccounts ?? []).map(normalize));
    const detailsByPlatform: Record<string, AyrshareDisplayName> = {};
    for (const d of profile.displayNames ?? []) {
      const key = normalize(String(d.platform ?? ''));
      if (key) detailsByPlatform[key] = d;
    }

    const platforms = PLATFORMS
      .filter((p, i, arr) => arr.indexOf(p) === i && p !== 'twitter' && p !== 'gmb')
      .map((platform) => {
        const details = detailsByPlatform[platform];
        const refreshDaysRemaining = typeof details?.refreshDaysRemaining === 'number' ? details.refreshDaysRemaining : null;
        const refreshWarning =
          (platform === 'linkedin' || platform === 'tiktok') &&
          refreshDaysRemaining !== null && refreshDaysRemaining < 30;
        return {
          platform,
          connected: active.has(platform),
          username: details?.username ?? null,
          displayName: details?.displayName ?? null,
          userImage: details?.userImage ?? null,
          messagingActive: Boolean(details?.messagingActive),
          refreshDaysRemaining,
          refreshWarning,
          connectedAt: typeof details?.created === 'string' ? details.created : null,
        };
      });

    return NextResponse.json({ platforms });
  } catch (err) {
    if (err instanceof AyrshareError) {
      return NextResponse.json(
        { error: err.message, code: err.code, platforms: [] },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: 'Ayrshare unavailable', code: 'provider_error', platforms: [] },
      { status: 503 },
    );
  }
}

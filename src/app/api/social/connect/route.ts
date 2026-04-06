import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { createProfile, generateLinkingUrl } from '@/lib/ayrshare';

/**
 * POST /api/social/connect
 *
 * Ensures the user has an Ayrshare profile, then returns a Max social-linking
 * URL the client opens (new tab / modal) so the user can connect their accounts.
 *
 * Response: { url: string }
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // Fetch or create Ayrshare profile
  let dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { email: true, profileKey: true, ayrshareUserId: true },
  });
  if (!dbUser) return errorResponse('User not found', 404);

  let profileKey = dbUser.profileKey;

  if (!profileKey) {
    // Create a new Ayrshare profile keyed by the user's email
    const profile = await createProfile(dbUser.email);
    if (!profile) return errorResponse('Could not create social profile', 502);

    profileKey = profile.profileKey;
    await prisma.user.update({
      where: { id: user.sub },
      data: { profileKey, ayrshareUserId: profile.id },
    });
  }

  // Generate the Max linking URL
  const url = await generateLinkingUrl(profileKey);
  if (!url) return errorResponse('Could not generate linking URL', 502);

  return Response.json({ url });
}

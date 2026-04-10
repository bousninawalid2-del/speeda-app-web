/**
 * sync-n8n.ts
 *
 * Fire-and-forget helpers that push Speeda data into the n8n "datatest"
 * PostgreSQL database after every relevant Prisma upsert.
 *
 * These functions NEVER throw — failures are logged and swallowed so that
 * a datatest outage cannot affect Speeda API responses.
 */

import { n8nPool } from '@/lib/db-n8n';
import { prisma } from '@/lib/db';

// ⚠️ SECURITY: users table is NEVER synced — incompatible auth systems (bcrypt/JWT vs Spring Security)
// datatest.users is used READ-ONLY to resolve email → user_id mapping only

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolve the n8n bigint user_id that corresponds to the given Speeda userId,
 * using email as the common key.
 *
 * Returns null when the user or email cannot be found in either database.
 */
async function resolveN8nUserId(speedaUserId: string): Promise<bigint | null> {
  const user = await prisma.user.findUnique({
    where:  { id: speedaUserId },
    select: { email: true },
  });
  if (!user?.email) return null;

  const result = await n8nPool.query<{ id: bigint }>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [user.email],
  );
  return result.rows[0]?.id ?? null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Push the current Speeda Preference row for `userId` into datatest.preferences.
 *
 * Fire-and-forget: call as `syncPreferenceToN8n(userId).catch(() => {})`.
 */
export async function syncPreferenceToN8n(userId: string): Promise<void> {
  try {
    const [pref, n8nUserId] = await Promise.all([
      prisma.preference.findUnique({ where: { userId } }),
      resolveN8nUserId(userId),
    ]);

    if (!pref || n8nUserId == null) return;

    const color =
      pref.color_primary || pref.color_secondary
        ? `${pref.color_primary ?? ''}|${pref.color_secondary ?? ''}`
        : null;

    await n8nPool.query(
      `INSERT INTO preferences
         (user_id, tone_of_voice, language_preference, social_media_goals,
          preferred_platforms, hashtags, emojis, other, resumer, text, color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (user_id) DO UPDATE SET
         tone_of_voice        = EXCLUDED.tone_of_voice,
         language_preference  = EXCLUDED.language_preference,
         social_media_goals   = EXCLUDED.social_media_goals,
         preferred_platforms  = EXCLUDED.preferred_platforms,
         hashtags             = EXCLUDED.hashtags,
         emojis               = EXCLUDED.emojis,
         other                = EXCLUDED.other,
         resumer              = EXCLUDED.resumer,
         text                 = EXCLUDED.text,
         color                = EXCLUDED.color`,
      [
        n8nUserId,
        pref.tone_of_voice        ?? null,
        pref.language_preference  ?? null,
        pref.social_media_goals   ?? null,
        pref.preferred_platforms  ?? null,
        pref.hashtags             ?? null,
        pref.emojis               ?? null,
        pref.other                ?? null,
        pref.business_description ?? null,  // → resumer
        pref.business_description ?? null,  // → text
        color,
      ],
    );
  } catch (err) {
    console.error('[sync-n8n] syncPreferenceToN8n failed:', err);
  }
}

/**
 * Push the current Speeda Activity row for `userId` into datatest.activities.
 *
 * Fire-and-forget: call as `syncActivityToN8n(userId).catch(() => {})`.
 */
export async function syncActivityToN8n(userId: string): Promise<void> {
  try {
    const [activity, n8nUserId] = await Promise.all([
      prisma.activity.findUnique({ where: { userId } }),
      resolveN8nUserId(userId),
    ]);

    if (!activity || n8nUserId == null) return;

    await n8nPool.query(
      `INSERT INTO activities
         (user_id, business_name, industry, location, opening_hours,
          business_size, year_founded, audience_target,
          unique_selling_point, certifications)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (user_id) DO UPDATE SET
         business_name        = EXCLUDED.business_name,
         industry             = EXCLUDED.industry,
         location             = EXCLUDED.location,
         opening_hours        = EXCLUDED.opening_hours,
         business_size        = EXCLUDED.business_size,
         year_founded         = EXCLUDED.year_founded,
         audience_target      = EXCLUDED.audience_target,
         unique_selling_point = EXCLUDED.unique_selling_point,
         certifications       = EXCLUDED.certifications`,
      [
        n8nUserId,
        activity.business_name        ?? null,
        activity.industry             ?? null,
        activity.location             ?? null,
        activity.opening_hours        ?? null,
        activity.business_size        ?? null,
        activity.year_founded         ?? null,
        activity.audience_target      ?? null,
        activity.unique_selling_point ?? null,
        activity.certifications       ?? null,
      ],
    );
  } catch (err) {
    console.error('[sync-n8n] syncActivityToN8n failed:', err);
  }
}

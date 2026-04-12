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

// ─── Internal helpers ─────────────────────────────────────────────────────────

// ⚠️ SECURITY: users table used READ-WRITE for sync only, never for auth

/** Placeholder used when the Speeda user has no phone number on file. */
const DEFAULT_PHONE_PLACEHOLDER = '0000000000';

/**
 * Resolve (or create) the n8n bigint user_id that corresponds to the given
 * Speeda userId, using email as the common key.
 *
 * If the user does not exist in datatest.users it is inserted automatically so
 * that subsequent syncs can always find a valid user_id.
 *
 * Returns null only when the Speeda user itself cannot be found.
 * Never throws — all errors are logged and swallowed.
 */
async function getOrCreateN8nUserId(speedaUserId: string): Promise<bigint | null> {
  try {
    const speedaUser = await prisma.user.findUnique({
      where:  { id: speedaUserId },
      select: { email: true, name: true, phone: true },
    });
    if (!speedaUser?.email) return null;

    // 1. Look up existing row
    const existing = await n8nPool.query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [speedaUser.email],
    );
    if (existing.rows.length > 0) return BigInt(existing.rows[0].id);

    // 2. Insert using MAX(id)+1 inside the same statement to narrow the race
    //    window.  ON CONFLICT handles the rare case where two concurrent
    //    inserts collide on email; the re-fetch below always returns the
    //    winner's row.
    // WARNING: potential race condition under high load
    await n8nPool.query(
      `INSERT INTO users (id, email, username, phone_number, role, status, updated_at)
       SELECT COALESCE(MAX(id), 0) + 1, $1, $2, $3, 'CLIENT', 'CONFIRMER', NOW()
       FROM users
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW()`,
      [
        speedaUser.email,
        speedaUser.name || speedaUser.email,
        speedaUser.phone || DEFAULT_PHONE_PLACEHOLDER,
      ],
    );

    // 3. Re-fetch to get the actual id (may differ if conflict was triggered)
    const inserted = await n8nPool.query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [speedaUser.email],
    );
    return inserted.rows.length > 0 ? BigInt(inserted.rows[0].id) : null;
  } catch (err) {
    console.error('[sync-n8n] getOrCreateN8nUserId error:', err);
    return null;
  }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Ensure a datatest.users row exists for the given Speeda user id.
 * Safe to call fire-and-forget: `ensureN8nUserById(id).catch(() => {})`.
 */
export async function ensureN8nUserById(speedaUserId: string): Promise<void> {
  await getOrCreateN8nUserId(speedaUserId);
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
      getOrCreateN8nUserId(userId),
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
      getOrCreateN8nUserId(userId),
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

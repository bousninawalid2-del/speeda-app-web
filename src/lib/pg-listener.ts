/**
 * pg-listener.ts
 *
 * Listens to the PostgreSQL NOTIFY channel "speeda_sync" on the n8n datatest
 * database and propagates changes back into Speeda via Prisma.
 *
 * Direction: datatest → Speeda (e.g. user updates preferences via WhatsApp/AI)
 *
 * The listener writes directly to Prisma without calling sync-n8n, so there
 * is no circular loop — outbound syncs are only triggered from API routes.
 *
 * Singleton — safe to call startPgListener() multiple times.
 */

import { Client } from 'pg';
import { prisma } from '@/lib/db';
import { n8nPool } from '@/lib/db-n8n';

// ─── Types for the NOTIFY payload ─────────────────────────────────────────────

interface N8nPreferencesRow {
  id:                  number;
  user_id:             number;
  tone_of_voice?:      string | null;
  language_preference?:string | null;
  social_media_goals?: string | null;
  preferred_platforms?:string | null;
  hashtags?:           string | null;
  emojis?:             string | null;
  other?:              string | null;
  resumer?:            string | null;
  text?:               string | null;
  color?:              string | null;
  /** Used by the trigger to identify which table fired */
  _table?:             string;
}

interface N8nActivitiesRow {
  id:                   number;
  user_id:              number;
  business_name?:       string | null;
  industry?:            string | null;
  location?:            string | null;
  opening_hours?:       string | null;
  business_size?:       string | null;
  year_founded?:        string | null;
  audience_target?:     string | null;
  unique_selling_point?:string | null;
  certifications?:      string | null;
  /** Used by the trigger to identify which table fired */
  _table?:              string;
}

type SyncPayload = N8nPreferencesRow | N8nActivitiesRow;

// ─── Email/userId resolution ──────────────────────────────────────────────────

async function resolveSpeedaUserId(n8nUserId: number): Promise<bigint | null> {
  const emailRes = await n8nPool.query<{ email: string }>(
    'SELECT email FROM users WHERE id = $1 LIMIT 1',
    [n8nUserId],
  );
  const email = emailRes.rows[0]?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true },
  });
  return user?.id ?? null;
}

// ─── Upsert handlers ──────────────────────────────────────────────────────────

async function handlePreferences(row: N8nPreferencesRow): Promise<void> {
  const userId = await resolveSpeedaUserId(row.user_id);
  if (!userId) {
    console.warn('[pg-listener] No Speeda user found for n8n user_id', row.user_id);
    return;
  }

  const data = {
    tone_of_voice:        row.tone_of_voice        ?? undefined,
    language_preference:  row.language_preference  ?? undefined,
    resumer:              row.resumer              ?? undefined,
    text:                 row.text                 ?? undefined,
    social_media_goals:   row.social_media_goals   ?? undefined,
    preferred_platforms:  row.preferred_platforms  ?? undefined,
    hashtags:             row.hashtags             ?? undefined,
    emojis:               row.emojis               ?? undefined,
    other:                row.other                ?? undefined,
    color:                row.color                ?? undefined,
  };

  await prisma.preference.upsert({
    where:  { userId },
    create: { userId, ...data },
    update: data,
  });
}

async function handleActivities(row: N8nActivitiesRow): Promise<void> {
  const userId = await resolveSpeedaUserId(row.user_id);
  if (!userId) {
    console.warn('[pg-listener] No Speeda user found for n8n user_id', row.user_id);
    return;
  }

  const data = {
    business_name:        row.business_name        ?? undefined,
    industry:             row.industry             ?? undefined,
    location:             row.location             ?? undefined,
    opening_hours:        row.opening_hours        ?? undefined,
    business_size:        row.business_size        ?? undefined,
    year_founded:         row.year_founded         ?? undefined,
    audience_target:      row.audience_target      ?? undefined,
    unique_selling_point: row.unique_selling_point ?? undefined,
    certifications:       row.certifications       ?? undefined,
  };

  await prisma.activity.upsert({
    where:  { userId },
    create: { userId, ...data },
    update: data,
  });
}

// ─── Core listener ────────────────────────────────────────────────────────────

let started = false;

function createClient(): Client {
  return new Client({ connectionString: process.env.DATABASE_N8N_URL });
}

async function connect(retryDelayMs = 1000): Promise<void> {
  const client = createClient();

  client.on('error', (err) => {
    console.error('[pg-listener] Connection error:', err.message);
  });

  client.on('end', () => {
    console.warn('[pg-listener] Connection ended — reconnecting in', retryDelayMs, 'ms');
    setTimeout(() => connect(Math.min(retryDelayMs * 2, 30_000)), retryDelayMs);
  });

  try {
    await client.connect();
    await client.query('LISTEN speeda_sync');
    console.log('[pg-listener] Listening on channel speeda_sync');

    client.on('notification', (msg) => {
      if (!msg.payload) return;
      let payload: SyncPayload;
      try {
        payload = JSON.parse(msg.payload) as SyncPayload;
      } catch {
        console.error('[pg-listener] Failed to parse notification payload:', msg.payload);
        return;
      }

      const table = (payload as { _table?: string })._table;

      if (table === 'preferences') {
        handlePreferences(payload as N8nPreferencesRow).catch((err) =>
          console.error('[pg-listener] handlePreferences error:', err),
        );
      } else if (table === 'activities') {
        handleActivities(payload as N8nActivitiesRow).catch((err) =>
          console.error('[pg-listener] handleActivities error:', err),
        );
      } else {
        console.warn('[pg-listener] Unknown table in payload:', table);
      }
    });
  } catch (err) {
    console.error('[pg-listener] Failed to connect:', (err as Error).message, '— retrying in', retryDelayMs, 'ms');
    await client.end().catch(() => {});
    setTimeout(() => connect(Math.min(retryDelayMs * 2, 30_000)), retryDelayMs);
  }
}

/**
 * Start the LISTEN/NOTIFY listener.  Safe to call multiple times — only one
 * listener will ever be active.
 */
export function startPgListener(): void {
  if (!process.env.DATABASE_N8N_URL) {
    console.warn('[pg-listener] DATABASE_N8N_URL not set — listener disabled');
    return;
  }
  if (started) return;
  started = true;
  connect().catch((err) =>
    console.error('[pg-listener] Unexpected startup error:', err),
  );
}

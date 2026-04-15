import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { makeDiscussionCode } from '@/lib/discussion-code';

interface SettingsMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

function toObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toItemsArray(payload: Record<string, unknown>): unknown[] {
  const candidates = [payload.items, payload.menuItems, payload.menu];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function normalizeItem(value: unknown, index: number): SettingsMenuItem {
  const item = toObject(value);
  return {
    id: toNumberValue(item.id, index + 1),
    name: toStringValue(item.name, ''),
    description: toStringValue(item.description, ''),
    price: toNumberValue(item.price, 0),
    category: toStringValue(item.category, 'Other'),
  };
}

function getSettingsMenuWebhookUrl(): string | null {
  if (process.env.N8N_SETTINGS_MENU_WEBHOOK_URL) return process.env.N8N_SETTINGS_MENU_WEBHOOK_URL;
  if (!process.env.N8N_BASE_URL) return null;

  try {
    return new URL('/webhook/settings-menu', process.env.N8N_BASE_URL).toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const discuCode = makeDiscussionCode(auth.user.sub);
  const webhookUrl = getSettingsMenuWebhookUrl();
  if (!discuCode || !webhookUrl) {
    return NextResponse.json({ error: 'Menu provider unavailable' }, { status: 503 });
  }

  try {
    const targetUrl = new URL(webhookUrl);
    targetUrl.searchParams.set('discu_code', discuCode);

    const providerResponse = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (!providerResponse.ok) {
      return NextResponse.json({ error: 'Menu provider unavailable' }, { status: 503 });
    }

    const payload = toObject(await providerResponse.json().catch(() => ({})));
    const items = toItemsArray(payload)
      .map(normalizeItem)
      .filter((item) => item.name.trim() !== '');

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: 'Menu provider unavailable' }, { status: 503 });
  }
}

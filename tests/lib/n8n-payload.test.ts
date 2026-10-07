import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '../helpers/prisma';

const db = vi.hoisted(() => ({ prisma: null as unknown as PrismaMock }));
vi.mock('@/lib/db', () => db);
vi.mock('@/lib/discussion-code', () => ({
  regenerateDiscussionCodeForUser: vi.fn(async () => ({ code: '12345678', key: 'new-key' })),
}));

import { buildN8nPayload, computeUserFlags } from '@/lib/n8n-payload';
import { regenerateDiscussionCodeForUser } from '@/lib/discussion-code';

const baseUser = { id: BigInt(42), name: 'Malek', email: 'm@test.dev', phone: '966500000000', password: 'hash', isVerified: true };

function seed(p: PrismaMock, o: { user?: object; activity?: object | null; preference?: object | null; code?: object | null; counts?: Partial<Record<string, number>> } = {}) {
  const c = { activity: 1, preference: 1, strategy: 0, refreshToken: 1, ...o.counts };
  p.user.findUniqueOrThrow.mockResolvedValue({ ...baseUser, ...o.user });
  p.activity.findUnique.mockResolvedValue(o.activity === undefined ? {
    id: BigInt(7), business_name: 'Brunch & Co', industry: 'Food', business_description: 'Weekend brunch', location: 'Riyadh',
    opening_hours: null, audience_target: 'Families', business_size: null, unique_selling_point: null, year_founded: null,
    certifications: null, resumer: 'Brunch summary',
  } : o.activity);
  p.preference.findUnique.mockResolvedValue(o.preference === undefined ? {
    id: BigInt(9), resumer: 'Friendly tone', preferred_platforms: 'instagram,tiktok', tone_of_voice: 'Friendly', language_preference: 'ar',
  } : o.preference);
  p.userDiscussionCode.findUnique.mockResolvedValue(o.code === undefined ? { code: 'DISC_42', key: 'INIT_42' } : o.code);
  p.activity.count.mockResolvedValue(c.activity);
  p.preference.count.mockResolvedValue(c.preference);
  p.strategy.count.mockResolvedValue(c.strategy);
  p.refreshToken.count.mockResolvedValue(c.refreshToken);
}

describe('buildN8nPayload — one payload shape for both channels', () => {
  beforeEach(() => { db.prisma = createPrismaMock(); });

  it('builds the web payload with the normalized block and web routing flags', async () => {
    seed(db.prisma, { counts: { strategy: 1 } });
    const p = await buildN8nPayload({ channel: 'web', userId: BigInt(42), sessionId: '42-1', message: { text: 'Hello' } });

    expect(p).toMatchObject({
      channel: 'web', source: 'web', user_id: '42', session_id: '42-1', phone: '966500000000',
      message: 'Hello', is_text: true, is_image: false, is_interactive: false,
      user_exist: true, token_valide: true, restapiRegister: false, activity_exist: true, preference_exist: true, user_strategy: true,
      business_name: 'Brunch & Co', business_description: 'Weekend brunch', activity_text: 'Brunch summary',
      preference_text: 'Friendly tone\n\nPreferred Platforms: instagram,tiktok',
      discu_code: 'DISC_42', discu_key: 'INIT_42',
    });
    expect(p.normalized).toEqual({ channel: 'web', userId: '42', sessionId: '42-1', messageText: 'Hello', metadata: { phoneNumber: '966500000000', webSessionId: '42-1' } });
    expect(db.prisma.refreshToken.count).not.toHaveBeenCalled();
  });

  it('computes the same keys for WhatsApp; token_valide follows the web session', async () => {
    seed(db.prisma, { counts: { refreshToken: 0 } });
    const p = await buildN8nPayload({ channel: 'whatsapp', userId: BigInt(42), sessionId: 'wa-966', message: { text: 'Salam', externalMessageId: 'wamid.1' } });
    expect(p).toMatchObject({ channel: 'whatsapp', user_exist: true, token_valide: false, wa_message_id: 'wamid.1' });
    expect(p.normalized.metadata.webSessionId).toBeNull();
  });

  it('forwards interactive title and id separately', async () => {
    seed(db.prisma);
    const p = await buildN8nPayload({ channel: 'web', userId: BigInt(42), sessionId: 's', message: { text: 'Quick Post', interactive: { id: 'quick_post', title: 'Quick Post' } } });
    expect(p).toMatchObject({ is_interactive: true, is_text: false, interactive_title: 'Quick Post', interactive_id: 'quick_post' });
  });

  it.each([
    ['image', { image_media_id: 'm1', image_caption: 'cap', is_image: true, message: 'cap' }],
    ['voice', { voice_media_id: 'm1', voice_filename: 'a.ogg', is_voice: true }],
    ['pdf', { pdf_media_id: 'm1', pdf_filename: 'menu.pdf', is_pdf: true }],
  ] as const)('maps %s media to the right fields', async (type, expected) => {
    seed(db.prisma);
    const p = await buildN8nPayload({
      channel: 'whatsapp', userId: BigInt(42), sessionId: 's',
      message: { media: { type, id: 'm1', caption: type === 'image' ? 'cap' : null, filename: type === 'voice' ? 'a.ogg' : type === 'pdf' ? 'menu.pdf' : null } },
    });
    expect(p).toMatchObject({ ...expected, is_text: false });
  });

  it('handles a user without profile/preference/phone and creates a discussion code', async () => {
    seed(db.prisma, { user: { phone: null, password: null, isVerified: false }, activity: null, preference: null, code: null, counts: { activity: 0, preference: 0 } });
    const p = await buildN8nPayload({ channel: 'web', userId: BigInt(42), sessionId: '42-9', message: {} });
    expect(p).toMatchObject({
      phone: '42-9', message: '', user_exist: false, token_valide: false, activity_exist: false, preference_exist: false,
      activity_id: '', preference_text: '', discu_code: '12345678', discu_key: 'new-key',
    });
    expect(regenerateDiscussionCodeForUser).toHaveBeenCalledWith(BigInt(42));
  });

  it('leaves phone empty for a WhatsApp payload without a stored phone', async () => {
    seed(db.prisma, { user: { phone: null } });
    const p = await buildN8nPayload({ channel: 'whatsapp', userId: BigInt(42), sessionId: 'wa-x', message: { text: 'x' } });
    expect(p.phone).toBe('');
  });
});

describe('computeUserFlags', () => {
  beforeEach(() => { db.prisma = createPrismaMock(); });

  it('treats a verified account without password as existing', async () => {
    seed(db.prisma, { counts: { refreshToken: 2 } });
    await expect(computeUserFlags({ id: BigInt(1), password: '  ', isVerified: true }, 'whatsapp'))
      .resolves.toMatchObject({ user_exist: true, token_valide: true });
  });
});

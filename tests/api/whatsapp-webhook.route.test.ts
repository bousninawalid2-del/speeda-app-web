import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '../helpers/prisma';
import { getRequest, jsonRequest } from '../helpers/http';

const db = vi.hoisted(() => ({ prisma: null as unknown as PrismaMock }));
const builder = vi.hoisted(() => ({ build: vi.fn() }));
vi.mock('@/lib/db', () => db);
vi.mock('@/lib/n8n-payload', () => ({ buildN8nPayload: builder.build }));

import { GET, POST } from '@/app/api/webhooks/whatsapp/route';

const URL = 'https://app.test/api/webhooks/whatsapp';
const fetchMock = vi.fn();
const meta = (message: Record<string, unknown>) => ({ entry: [{ changes: [{ value: { messages: [{ from: '966500000000', id: 'wamid.1', ...message }] } }] }] });

beforeEach(() => {
  db.prisma = createPrismaMock();
  db.prisma.user.findFirst.mockResolvedValue({ id: BigInt(42), phone: '966500000000' });
  builder.build.mockReset().mockResolvedValue({ channel: 'whatsapp', user_id: '42' });
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset().mockResolvedValue(new Response('{}', { status: 200 }));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/webhooks/whatsapp (Meta verification)', () => {
  it('echoes the challenge for the right verify token', async () => {
    const res = await GET(getRequest(`${URL}?hub.mode=subscribe&hub.challenge=abc&hub.verify_token=whatsappWebhookToken2026`));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('abc');
  });
  it('returns 403 for a wrong token and 400 for missing params', async () => {
    expect((await GET(getRequest(`${URL}?hub.mode=subscribe&hub.challenge=abc&hub.verify_token=nope`))).status).toBe(403);
    expect((await GET(getRequest(URL))).status).toBe(400);
  });
});

describe('POST /api/webhooks/whatsapp (Meta → n8n)', () => {
  it('normalizes a text message through the shared builder and forwards it to n8n', async () => {
    const res = await POST(jsonRequest(URL, meta({ type: 'text', text: { body: 'Salam' } })));
    expect(await res.json()).toEqual({ ok: true });
    expect(builder.build).toHaveBeenCalledWith({
      channel: 'whatsapp', userId: BigInt(42), sessionId: 'wa-966500000000',
      message: { text: 'Salam', interactive: null, media: null, externalMessageId: 'wamid.1' },
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST', body: JSON.stringify({ channel: 'whatsapp', user_id: '42' }) }));
  });

  it('creates a placeholder user for an unknown phone number', async () => {
    db.prisma.user.findFirst.mockResolvedValue(null);
    db.prisma.user.create.mockResolvedValue({ id: BigInt(77) });
    await POST(jsonRequest(URL, meta({ type: 'text', text: { body: 'hi' } })));
    expect(db.prisma.user.create).toHaveBeenCalledWith({ data: { phone: '966500000000', name: 'user_966500000000', email: 'temp_966500000000@speeda.local' } });
    expect(builder.build.mock.calls[0][0].userId).toBe(BigInt(77));
  });

  it.each([
    ['interactive list reply', { type: 'interactive', interactive: { list_reply: { id: 'option_1', title: 'Quick Post' } } }, { interactive: { id: 'option_1', title: 'Quick Post' } }],
    ['button reply', { type: 'interactive', interactive: { button_reply: { id: 'approve', title: 'Approve' } } }, { interactive: { id: 'approve', title: 'Approve' } }],
    ['image', { type: 'image', image: { id: 'm1', caption: 'my brunch' } }, { media: { type: 'image', id: 'm1', caption: 'my brunch' } }],
    ['voice note', { type: 'audio', audio: { id: 'v1', voice: true } }, { media: { type: 'voice', id: 'v1', filename: null } }],
    ['pdf', { type: 'document', document: { id: 'd1', filename: 'menu.pdf', mime_type: 'application/pdf' } }, { media: { type: 'pdf', id: 'd1', filename: 'menu.pdf' } }],
  ])('maps a WhatsApp %s', async (_label, message, expected) => {
    await POST(jsonRequest(URL, meta(message)));
    expect(builder.build.mock.calls[0][0].message).toMatchObject({ text: null, ...expected });
  });

  it('ignores audio files that are not voice notes and non-PDF documents', async () => {
    await POST(jsonRequest(URL, meta({ type: 'audio', audio: { id: 'a1', voice: false } })));
    await POST(jsonRequest(URL, meta({ type: 'document', document: { id: 'd2', filename: 'x.docx', mime_type: 'application/msword' } })));
    expect(builder.build.mock.calls.map(c => c[0].message.media)).toEqual([null, null]);
  });

  it('acknowledges without forwarding when there is no sender', async () => {
    const res = await POST(jsonRequest(URL, { entry: [] }));
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('always acknowledges Meta, even when n8n or the handler fails', async () => {
    fetchMock.mockResolvedValue(new Response('down', { status: 500 }));
    expect((await POST(jsonRequest(URL, meta({ type: 'text', text: { body: 'x' } })))).status).toBe(200);
    builder.build.mockRejectedValue(new Error('db down'));
    expect(await (await POST(jsonRequest(URL, meta({ type: 'text', text: { body: 'x' } })))).json()).toEqual({ ok: true });
    expect((await POST(jsonRequest(URL, 'not json'))).status).toBe(200);
  });
});

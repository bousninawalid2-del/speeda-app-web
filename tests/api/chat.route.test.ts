import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bearer, jsonRequest } from '../helpers/http';

const mocks = vi.hoisted(() => ({
  build: vi.fn(),
  allow: vi.fn(() => true),
}));
vi.mock('@/lib/n8n-payload', () => ({ buildN8nPayload: mocks.build }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: mocks.allow }));

import { POST } from '@/app/api/chat/route';

const URL = 'https://app.test/api/chat';
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  mocks.build.mockReset().mockResolvedValue({ channel: 'web', user_id: '42' });
  mocks.allow.mockReset().mockReturnValue(true);
  process.env.N8N_WEBHOOK_URL = 'https://n8n.test/webhook/root';
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const n8nReplies = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

describe('POST /api/chat', () => {
  it('rejects unauthenticated requests (401)', async () => {
    expect((await POST(jsonRequest(URL, { message: 'hi' }))).status).toBe(401);
  });

  it('rate-limits per user (429)', async () => {
    mocks.allow.mockReturnValue(false);
    expect((await POST(jsonRequest(URL, { message: 'hi' }, { authorization: bearer() }))).status).toBe(429);
  });

  it('returns 503 when the n8n webhook is not configured', async () => {
    delete process.env.N8N_WEBHOOK_URL;
    expect((await POST(jsonRequest(URL, { message: 'hi' }, { authorization: bearer() }))).status).toBe(503);
  });

  it.each([['not json'], [{ message: '' }], [{ message: 'x', mediaType: 'video' }]])('validates the body (400) for %o', async (body) => {
    expect((await POST(jsonRequest(URL, body, { authorization: bearer() }))).status).toBe(400);
  });

  it('builds the web payload and forwards it to n8n', async () => {
    n8nReplies({ reply: 'Hi there', type: 'text' });
    const res = await POST(jsonRequest(URL, { message: 'Hello', sessionId: '42-1' }, { authorization: bearer() }));

    expect(res.status).toBe(200);
    expect(mocks.build).toHaveBeenCalledWith({ channel: 'web', userId: BigInt(42), sessionId: '42-1', message: { text: 'Hello', interactive: null, media: null } });
    expect(fetchMock).toHaveBeenCalledWith('https://n8n.test/webhook/root', expect.objectContaining({ method: 'POST', body: JSON.stringify({ channel: 'web', user_id: '42' }) }));
    expect(await res.json()).toEqual({ reply: 'Hi there', type: 'text', sessionId: '42-1' });
  });

  it('creates a session id when none is sent and forwards interactive + media fields', async () => {
    n8nReplies({ reply: 'ok' });
    const res = await POST(jsonRequest(URL, {
      message: 'Quick Post', isInteractive: true, interactiveTitle: 'Quick Post', interactiveId: 'quick_post', mediaId: 'img1', mediaType: 'image',
    }, { authorization: bearer() }));
    const { message, sessionId } = mocks.build.mock.calls[0][0];
    expect(sessionId).toMatch(/^42-\d+$/);
    expect(message).toEqual({ text: 'Quick Post', interactive: { id: 'quick_post', title: 'Quick Post' }, media: { type: 'image', id: 'img1' } });
    expect((await res.json()).sessionId).toBe(sessionId);
  });

  it('turns a raw WhatsApp interactive payload from n8n into text + options (no raw JSON)', async () => {
    n8nReplies({ messaging_product: 'whatsapp', type: 'interactive', interactive: { type: 'list', body: { text: 'Choose' }, action: { sections: [{ rows: [{ id: 'option_1', title: 'Quick Post' }] }] } } });
    const body = await (await POST(jsonRequest(URL, { message: 'x' }, { authorization: bearer() }))).json();
    expect(body).toMatchObject({ reply: 'Choose', options: [{ id: 'option_1', title: 'Quick Post' }] });
    expect(JSON.stringify(body)).not.toContain('messaging_product');
  });

  it('returns an empty reply for an acknowledgement-only response', async () => {
    n8nReplies({});
    expect(await (await POST(jsonRequest(URL, { message: 'x' }, { authorization: bearer() }))).json()).toMatchObject({ reply: '', type: 'text' });
  });

  it('maps an n8n error status to 502', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    expect((await POST(jsonRequest(URL, { message: 'x' }, { authorization: bearer() }))).status).toBe(502);
  });

  it('maps a network failure / payload build failure to 502', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    expect((await POST(jsonRequest(URL, { message: 'x' }, { authorization: bearer() }))).status).toBe(502);
    mocks.build.mockRejectedValue(new Error('db down'));
    expect((await POST(jsonRequest(URL, { message: 'x', sessionId: 's' }, { authorization: bearer() }))).status).toBe(502);
  });
});

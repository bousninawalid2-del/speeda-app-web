import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '../helpers/prisma';
import { bearer, getRequest, jsonRequest } from '../helpers/http';

const db = vi.hoisted(() => ({ prisma: null as unknown as PrismaMock }));
const rl = vi.hoisted(() => ({ allow: vi.fn(() => true) }));
vi.mock('@/lib/db', () => db);
vi.mock('@/lib/rate-limit', () => ({ rateLimit: rl.allow }));

import { GET, POST } from '@/app/api/n8n/respond/route';

const URL = 'https://app.test/api/n8n/respond';
const n8n = { 'x-n8n-secret': 'test-admin-secret' };

beforeEach(() => {
  db.prisma = createPrismaMock();
  db.prisma.user.findUnique.mockResolvedValue({ id: BigInt(42) });
  db.prisma.pendingChatResponse.create.mockResolvedValue({});
  db.prisma.pendingChatResponse.deleteMany.mockResolvedValue({ count: 0 });
  rl.allow.mockReset().mockReturnValue(true);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('POST /api/n8n/respond (n8n → web queue)', () => {
  it('requires the n8n secret', async () => {
    expect((await POST(jsonRequest(URL, { sessionId: 's', userId: '42', reply: 'x' }))).status).toBe(401);
  });

  it.each([['nope'], [{ userId: '42', reply: 'x' }]])('validates the body (400) for %o', async (body) => {
    expect((await POST(jsonRequest(URL, body, n8n))).status).toBe(400);
  });

  it('queues a plain text reply for the session and user', async () => {
    const res = await POST(jsonRequest(URL, { sessionId: '42-1', userId: '42', reply: 'Your strategy is ready', options: [{ id: 'a', title: 'Approve' }] }, n8n));
    expect(await res.json()).toEqual({ ok: true });
    expect(db.prisma.pendingChatResponse.create).toHaveBeenCalledWith({ data: {
      sessionId: '42-1', userId: BigInt(42), reply: 'Your strategy is ready', type: 'text', mediaUrl: undefined, options: '[{"id":"a","title":"Approve"}]',
    } });
  });

  it('unwraps a raw WhatsApp payload before queuing it', async () => {
    await POST(jsonRequest(URL, { sessionId: 's', userId: '42', reply: { messaging_product: 'whatsapp', type: 'text', text: { body: 'Salut' } } }, n8n));
    expect(db.prisma.pendingChatResponse.create.mock.calls[0][0].data).toMatchObject({ reply: 'Salut', options: null });
  });

  it('skips WhatsApp reactions (nothing to show on web)', async () => {
    const res = await POST(jsonRequest(URL, { sessionId: 's', userId: '42', reply: { messaging_product: 'whatsapp', type: 'reaction', reaction: { emoji: '👍' } } }, n8n));
    expect(await res.json()).toEqual({ ok: true, skipped: true });
    expect(db.prisma.pendingChatResponse.create).not.toHaveBeenCalled();
  });

  it('rejects unknown users (404) and rate-limits per session (429)', async () => {
    db.prisma.user.findUnique.mockResolvedValue(null);
    expect((await POST(jsonRequest(URL, { sessionId: 's', userId: '99', reply: 'x' }, n8n))).status).toBe(404);
    rl.allow.mockReturnValue(false);
    expect((await POST(jsonRequest(URL, { sessionId: 's', userId: '42', reply: 'x' }, n8n))).status).toBe(429);
  });
});

describe('GET /api/n8n/respond (web polling)', () => {
  it('requires a valid user token and a sessionId', async () => {
    expect((await GET(getRequest(`${URL}?sessionId=s`))).status).toBe(401);
    expect((await GET(getRequest(`${URL}?sessionId=s`, { authorization: 'Bearer forged' }))).status).toBe(401);
    expect((await GET(getRequest(URL, { authorization: bearer() }))).status).toBe(400);
  });

  it('returns only the caller’s pending messages, in order, and marks them consumed', async () => {
    const created = new Date('2026-10-08T10:00:00Z');
    db.prisma.pendingChatResponse.findMany.mockResolvedValue([
      { id: 'a', reply: 'One', type: 'text', mediaUrl: null, options: '[{"id":"x","title":"X"}]', createdAt: created },
      { id: 'b', reply: 'Two', type: 'image', mediaUrl: 'https://x/i.png', options: null, createdAt: created },
    ]);
    const body = await (await GET(getRequest(`${URL}?sessionId=42-1`, { authorization: bearer('42') }))).json();

    expect(db.prisma.pendingChatResponse.findMany).toHaveBeenCalledWith({ where: { sessionId: '42-1', userId: BigInt(42), consumedAt: null }, orderBy: { seq: 'asc' } });
    expect(db.prisma.pendingChatResponse.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['a', 'b'] } }, data: { consumedAt: expect.any(Date) } });
    expect(body.messages).toEqual([
      { reply: 'One', type: 'text', options: [{ id: 'x', title: 'X' }], timestamp: created.getTime() },
      { reply: 'Two', type: 'image', mediaUrl: 'https://x/i.png', timestamp: created.getTime() },
    ]);
  });

  it('returns an empty list without updating when nothing is pending', async () => {
    db.prisma.pendingChatResponse.findMany.mockResolvedValue([]);
    expect(await (await GET(getRequest(`${URL}?sessionId=s`, { authorization: bearer() }))).json()).toEqual({ messages: [] });
    expect(db.prisma.pendingChatResponse.updateMany).not.toHaveBeenCalled();
  });
});

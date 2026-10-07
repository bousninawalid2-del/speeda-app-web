import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createPrismaMock, type PrismaMock } from '../helpers/prisma';
import { bearer, getRequest } from '../helpers/http';

const db = vi.hoisted(() => ({ prisma: null as unknown as PrismaMock }));
const rl = vi.hoisted(() => ({ allow: vi.fn(() => true) }));
vi.mock('@/lib/db', () => db);
vi.mock('@/lib/rate-limit', () => ({ rateLimit: rl.allow }));

import { GET, POST } from '@/app/api/chat/upload/route';

const URL = 'https://app.test/api/chat/upload';
const upload = (file: File | string | null, auth = true) => {
  const form = new FormData();
  if (file !== null) form.append('file', file);
  return new NextRequest(URL, { method: 'POST', headers: auth ? { authorization: bearer() } : {}, body: form });
};

beforeEach(() => {
  db.prisma = createPrismaMock();
  db.prisma.dataImage.create.mockImplementation(async ({ data }: { data: { filename: string } }) => ({ id: 'img_1', filename: data.filename }));
  rl.allow.mockReset().mockReturnValue(true);
});

describe('POST /api/chat/upload', () => {
  it('requires auth and applies the upload rate limit', async () => {
    expect((await POST(upload(new File(['x'], 'a.png', { type: 'image/png' }), false))).status).toBe(401);
    rl.allow.mockReturnValue(false);
    expect((await POST(upload(new File(['x'], 'a.png', { type: 'image/png' })))).status).toBe(429);
  });

  it('rejects non-multipart bodies, missing files, and unsupported types', async () => {
    const notForm = new NextRequest(URL, { method: 'POST', headers: { authorization: bearer(), 'content-type': 'application/json' }, body: '{}' });
    expect((await POST(notForm)).status).toBe(400);
    expect((await POST(upload(null))).status).toBe(400);
    expect((await POST(upload('just text'))).status).toBe(400);
    expect((await POST(upload(new File(['x'], 'v.mp4', { type: 'video/mp4' })))).status).toBe(400);
  });

  it('rejects files over 10 MB', async () => {
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    expect((await POST(upload(big))).status).toBe(400);
  });

  it.each([
    ['photo.jpg', 'image/jpeg', 'image'],
    ['note.ogg', 'audio/ogg', 'voice'],
    ['menu.pdf', 'application/pdf', 'pdf'],
  ])('stores %s and returns mediaType %s', async (name, type, mediaType) => {
    const res = await POST(upload(new File(['data'], name, { type })));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 'img_1', mediaType, mediaUrl: '/api/chat/upload?id=img_1', filename: name });
    expect(db.prisma.dataImage.create.mock.calls[0][0].data).toMatchObject({ userId: BigInt(42), mimetype: type, size: 4 });
  });
});

describe('GET /api/chat/upload', () => {
  it('serves a stored file with its content type', async () => {
    db.prisma.dataImage.findUnique.mockResolvedValue({ data: Buffer.from('png'), mimetype: 'image/png', filename: 'a.png' });
    const res = await GET(getRequest(`${URL}?id=img_1`));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('content-disposition')).toBe('inline; filename="a.png"');
    expect(await res.text()).toBe('png');
  });

  it('returns 400 without id and 404 for unknown ids', async () => {
    expect((await GET(getRequest(URL))).status).toBe(400);
    db.prisma.dataImage.findUnique.mockResolvedValue(null);
    expect((await GET(getRequest(`${URL}?id=nope`))).status).toBe(404);
  });
});

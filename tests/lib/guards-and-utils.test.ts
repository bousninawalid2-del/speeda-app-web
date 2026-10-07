import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createPrismaMock, type PrismaMock } from '../helpers/prisma';

const db = vi.hoisted(() => ({ prisma: null as unknown as PrismaMock }));
vi.mock('@/lib/db', () => db);

import { requireN8nAuth } from '@/lib/n8n-guard';
import { parseUserId, resolveExistingUserId } from '@/lib/n8n-validate';
import { rateLimit } from '@/lib/rate-limit';
import { traceLog } from '@/lib/trace';

const req = (headers: Record<string, string> = {}) => new NextRequest('https://app.test/api/n8n/x', { headers });

describe('requireN8nAuth', () => {
  it('accepts the shared secret', () => {
    expect(requireN8nAuth(req({ 'x-n8n-secret': 'test-admin-secret' }))).toBe(true);
  });
  it.each([[{}], [{ 'x-n8n-secret': 'wrong' }]])('rejects %o with 401', async (h) => {
    const res = requireN8nAuth(req(h)) as NextResponse;
    expect(res.status).toBe(401);
  });
  it('rejects everything when ADMIN_SECRET is not configured', () => {
    const saved = process.env.ADMIN_SECRET;
    delete process.env.ADMIN_SECRET;
    expect((requireN8nAuth(req({ 'x-n8n-secret': '' })) as NextResponse).status).toBe(401);
    process.env.ADMIN_SECRET = saved;
  });
});

describe('n8n-validate', () => {
  beforeEach(() => { db.prisma = createPrismaMock(); });

  it('parses numeric ids and rejects malformed ones with 400', async () => {
    expect(parseUserId('42')).toBe(BigInt(42));
    expect((parseUserId('abc') as NextResponse).status).toBe(400);
    expect((parseUserId('  ') as NextResponse).status).toBe(400);
  });

  it('resolves only existing users', async () => {
    db.prisma.user.findUnique.mockResolvedValueOnce({ id: BigInt(42) }).mockResolvedValueOnce(null);
    await expect(resolveExistingUserId('42')).resolves.toBe(BigInt(42));
    expect(((await resolveExistingUserId('43')) as NextResponse).status).toBe(404);
    expect(((await resolveExistingUserId('x')) as NextResponse).status).toBe(400);
  });
});

describe('rateLimit', () => {
  it('allows up to the limit within the window, then blocks, then resets', () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    expect([1, 2, 3].map(() => rateLimit(key, { limit: 2, windowMs: 1000 }))).toEqual([true, true, false]);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, { limit: 2, windowMs: 1000 })).toBe(true);
    vi.useRealTimers();
  });
});

describe('traceLog', () => {
  it('logs with the session id and optional metadata', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    traceLog('evt', 's-1', { a: 1 });
    traceLog('evt2', 's-2');
    expect(spy).toHaveBeenNthCalledWith(1, '[trace] session=s-1 event=evt', '{"a":1}');
    expect(spy).toHaveBeenNthCalledWith(2, '[trace] session=s-2 event=evt2', '');
  });
});

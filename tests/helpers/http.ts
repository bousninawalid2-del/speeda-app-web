import { NextRequest } from 'next/server';
import { signAccessToken } from '@/lib/jwt';

export const bearer = (userId = '42') =>
  `Bearer ${signAccessToken({ sub: userId, email: `u${userId}@test.dev`, name: 'Test User' })}`;

export function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}, method = 'POST') {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

export const getRequest = (url: string, headers: Record<string, string> = {}) =>
  new NextRequest(url, { method: 'GET', headers });

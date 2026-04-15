import jwt from 'jsonwebtoken';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

const ACCESS_SECRET  = requireEnv('JWT_ACCESS_SECRET');
const REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  ?? '7d';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES ?? '7d';

export interface AccessTokenPayload {
  sub: bigint;   // user id (deserialized from string in JWT)
  email: string;
  name?: string;
}

export interface RefreshTokenPayload {
  sub: bigint;   // user id (deserialized from string in JWT)
  jti: string;   // refresh token DB id — used for revocation
}

interface SignedAccessTokenPayload {
  sub: string;
  email: string;
  name?: string;
}

interface SignedRefreshTokenPayload {
  sub: string;
  jti: string;
}

/** Sign an access JWT (default 7 days) */
export function signAccessToken(payload: SignedAccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

/** Sign a long-lived refresh JWT (default 7 days) */
export function signRefreshToken(payload: SignedRefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);
}

/** Verify an access token — throws if invalid/expired */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, ACCESS_SECRET) as SignedAccessTokenPayload;
  return {
    ...payload,
    sub: BigInt(payload.sub),
  };
}

/** Verify a refresh token — throws if invalid/expired */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, REFRESH_SECRET) as SignedRefreshTokenPayload;
  return {
    ...payload,
    sub: BigInt(payload.sub),
  };
}

/** Parse expiry string like '7d', '15m', '1h' → milliseconds */
export function expiresInMs(str: string): number {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const val = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return val * multipliers[unit];
}

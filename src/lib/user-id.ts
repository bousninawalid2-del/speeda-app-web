export type UserIdInput = string | number | bigint;

export function toUserIdBigInt(value: UserIdInput): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);

  const normalized = value.trim();
  if (!normalized) throw new Error('User ID cannot be empty');
  return BigInt(normalized);
}

export function toUserIdString(value: UserIdInput): string {
  return typeof value === 'string' ? value : value.toString();
}

export function toJsonSafe(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map((item) => toJsonSafe(item));
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = toJsonSafe(nested);
    }
    return output;
  }
  return value;
}

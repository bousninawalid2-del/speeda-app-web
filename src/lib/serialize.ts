/**
 * Recursively converts BigInt values to strings so objects
 * can be safely passed to JSON.stringify / Response.json().
 */
export function serializePrisma<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  ) as T;
}

// Patch BigInt.prototype.toJSON globally so JSON.stringify never throws
// This is a one-time side-effect that applies when this module is first imported.
type BigIntWithToJSON = { toJSON?: () => string };
if (!(BigInt.prototype as unknown as BigIntWithToJSON).toJSON) {
  (BigInt.prototype as unknown as BigIntWithToJSON).toJSON = function () {
    return this.toString();
  };
}

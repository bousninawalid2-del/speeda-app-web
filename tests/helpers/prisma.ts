import { vi } from 'vitest';

type Fn = ReturnType<typeof vi.fn>;
const model = () => ({
  findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(),
  create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn(),
});

/** In-memory stand-in for the Prisma client, one vi.fn per model method. */
export function createPrismaMock() {
  return {
    user: model(), activity: model(), preference: model(), strategy: model(),
    userDiscussionCode: model(), refreshToken: model(), pendingChatResponse: model(),
    dataImage: model(),
  } as Record<string, Record<string, Fn>>;
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';

// ─── GET /api/tokens — current balance + usage history ───────────────────────

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { tokenBalance: true, tokenUsed: true },
  });

  if (!dbUser) return errorResponse('User not found', 404);

  const logs = await prisma.tokenLog.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, description: true, tokens: true, agent: true, createdAt: true,
    },
  });

  // Aggregate by agent
  const agentMap: Record<string, number> = {};
  for (const log of logs) {
    agentMap[log.agent] = (agentMap[log.agent] ?? 0) + log.tokens;
  }

  const packages = await prisma.tokenPackage.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, tokenCount: true, price: true },
  });

  return Response.json({
    balance: dbUser.tokenBalance,
    used:    dbUser.tokenUsed,
    total:   dbUser.tokenBalance + dbUser.tokenUsed,
    history: logs,
    byAgent: agentMap,
    packages,
  });
}

// Token purchases go through MamoPay — POST /api/billing/token-purchase

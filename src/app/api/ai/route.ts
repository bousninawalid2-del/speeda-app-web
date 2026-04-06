import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOKENS_PER_MESSAGE = 3; // deduct 3 tokens per AI request

const bodySchema = z.object({
  message:  z.string().min(1).max(4000),
  context:  z.string().optional(),
  history:  z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

// ─── POST /api/ai ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // 20 AI requests per user per minute
  if (!rateLimit(`ai:${user.sub}`, { limit: 20, windowMs: 60_000 })) {
    return errorResponse('Too many requests. Please wait a moment.', 429);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { message, context, history = [] } = parsed.data;

  // ── Token gate ─────────────────────────────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { tokenBalance: true, name: true, activity: { select: { business_name: true, industry: true, location: true } } },
  });

  if (!dbUser) return errorResponse('User not found', 404);
  if (dbUser.tokenBalance < TOKENS_PER_MESSAGE) {
    return errorResponse('Insufficient token balance', 402);
  }

  // ── Build system prompt ────────────────────────────────────────────────────
  const businessName = dbUser.activity?.business_name ?? dbUser.name ?? 'your business';
  const industry     = dbUser.activity?.industry ?? 'local business';
  const location     = dbUser.activity?.location ?? 'Saudi Arabia';

  const systemPrompt = [
    `You are Speeda AI, an expert social media marketing assistant for ${businessName}.`,
    `Business type: ${industry}. Location: ${location}.`,
    `You help with content creation, campaign strategy, engagement responses, and analytics insights.`,
    `Keep responses concise, actionable, and relevant to social media marketing in the Saudi/Gulf market.`,
    context ? `Additional context: ${context}` : '',
  ].filter(Boolean).join('\n');

  // ── Call Claude ────────────────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
    // Graceful fallback when API key not configured
    return Response.json({
      reply: `I'm Speeda AI and I'm ready to help with your marketing! To enable real AI responses, add your ANTHROPIC_API_KEY to the environment variables.`,
      tokensUsed: 0,
      history: [...history, { role: 'user', content: message }],
    });
  }

  const response = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system:     systemPrompt,
    messages: [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: message },
    ],
  });

  const reply = response.content[0].type === 'text' ? response.content[0].text : '';
  const inputTokens  = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  // Approximate Speeda tokens: 1 Speeda token ≈ 500 API tokens
  const speedaTokensUsed = Math.max(1, Math.ceil((inputTokens + outputTokens) / 500));

  // ── Deduct tokens + log usage ──────────────────────────────────────────────
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.sub },
      data: {
        tokenBalance: { decrement: speedaTokensUsed },
        tokenUsed:    { increment: speedaTokensUsed },
      },
    }),
    prisma.tokenLog.create({
      data: {
        userId:      user.sub,
        description: message.slice(0, 80),
        tokens:      speedaTokensUsed,
        agent:       'Content',
      },
    }),
  ]);

  return Response.json({
    reply,
    tokensUsed: speedaTokensUsed,
    history: [
      ...history,
      { role: 'user',      content: message },
      { role: 'assistant', content: reply },
    ],
  });
}

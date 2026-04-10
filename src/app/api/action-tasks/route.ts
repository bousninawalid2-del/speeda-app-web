import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';

/**
 * GET /api/action-tasks
 * Returns all ActionTasks for the current user, sorted by dueDate ASC.
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const tasks = await prisma.actionTask.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' },
  });

  return NextResponse.json({ tasks });
}

/**
 * POST /api/action-tasks
 * Creates a new ActionTask for the current user.
 * Body: { title, description?, platform?, dueDate?, priority?, strategyId? }
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const { title, description, platform, dueDate, priority, strategyId } = body as Record<string, unknown>;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return errorResponse('title is required', 400);
  }

  const task = await prisma.actionTask.create({
    data: {
      userId,
      title: (title as string).trim(),
      description: typeof description === 'string' ? description : undefined,
      platform: typeof platform === 'string' ? platform : undefined,
      dueDate: typeof dueDate === 'string' ? new Date(dueDate) : undefined,
      priority: typeof priority === 'string' ? priority : 'medium',
      strategyId: typeof strategyId === 'string' ? strategyId : undefined,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';

/**
 * PATCH /api/action-tasks/[id]
 * Updates status, priority, title, description, or dueDate of an ActionTask.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const { id } = await params;

  const existing = await prisma.actionTask.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return errorResponse('Task not found', 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const { title, description, platform, dueDate, status, priority } = body as Record<string, unknown>;

  const task = await prisma.actionTask.update({
    where: { id },
    data: {
      ...(typeof title === 'string' ? { title } : {}),
      ...(typeof description === 'string' ? { description } : {}),
      ...(typeof platform === 'string' ? { platform } : {}),
      ...(typeof dueDate === 'string' ? { dueDate: new Date(dueDate) } : {}),
      ...(typeof status === 'string' ? { status } : {}),
      ...(typeof priority === 'string' ? { priority } : {}),
    },
  });

  return NextResponse.json({ task });
}

/**
 * DELETE /api/action-tasks/[id]
 * Deletes an ActionTask (verifies ownership).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const { id } = await params;

  const existing = await prisma.actionTask.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return errorResponse('Task not found', 404);
  }

  await prisma.actionTask.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

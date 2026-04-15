import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { errorResponse } from '@/lib/auth-guard';
import { serializePrisma } from '@/lib/serialize';

/**
 * GET /api/n8n/images?userId=xxx
 *
 * Returns user's brand images (logo, menu, gallery).
 * For binary data, returns base64-encoded content.
 *
 * Optional: ?type=logo to filter by filename containing "logo"
 * Optional: ?metadataOnly=true to skip binary data
 */
export async function GET(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  const userId       = req.nextUrl.searchParams.get('userId');
  const type         = req.nextUrl.searchParams.get('type');
  const metadataOnly = req.nextUrl.searchParams.get('metadataOnly') === 'true';

  if (!userId) return errorResponse('userId is required', 400);

  const where: Record<string, unknown> = { userId };
  if (type) {
    where.filename = { contains: type, mode: 'insensitive' };
  }

  const images = await prisma.dataImage.findMany({
    where,
    select: {
      id: true,
      filename: true,
      mimetype: true,
      size: true,
      createdAt: true,
      ...(!metadataOnly ? { data: true } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  // Convert binary Buffer to base64 for JSON transport
  const result = images.map(img => ({
    id: img.id,
    filename: img.filename,
    mimetype: img.mimetype,
    size: img.size,
    createdAt: img.createdAt,
    ...('data' in img && img.data
      ? { dataBase64: Buffer.from(img.data as Buffer).toString('base64') }
      : {}),
  }));

  return Response.json(serializePrisma({ images: result }));
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { toUserIdBigInt } from '@/lib/user-id';

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const userId = toUserIdBigInt(auth.user.sub);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse('Expected multipart/form-data', 400);
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') return errorResponse('No file uploaded', 400);

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return errorResponse('File type not allowed. Use image or video.', 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_SIZE) {
    return errorResponse('File exceeds 20 MB limit', 400);
  }

  const media = await prisma.dataImage.create({
    data: {
      userId,
      filename: file.name,
      mimetype: file.type,
      size: buffer.byteLength,
      data: buffer,
    },
    select: { id: true },
  });

  return Response.json({ id: media.id, url: `/api/media?id=${media.id}` }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const userId = toUserIdBigInt(auth.user.sub);

    const type = req.nextUrl.searchParams.get('type');
    const where: { userId: bigint; mimetype?: { startsWith: string } } = { userId };
    if (type === 'photo') where.mimetype = { startsWith: 'image/' };
    if (type === 'video') where.mimetype = { startsWith: 'video/' };

    const items = await prisma.dataImage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        filename: true,
        mimetype: true,
        size: true,
        createdAt: true,
      },
    });

    return Response.json({ items });
  }

  const media = await prisma.dataImage.findUnique({
    where: { id },
    select: { id: true, filename: true, mimetype: true, data: true },
  });
  if (!media) return errorResponse('Not found', 404);
  const baseFilename = (media.filename.split(/[/\\]/).pop() ?? 'media').replace(/^\.+/, '');
  const safeFilename = baseFilename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 255) || 'media';

  return new Response(media.data, {
    headers: {
      'Content-Type': media.mimetype,
      'Content-Disposition': `inline; filename="${safeFilename}"`,
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

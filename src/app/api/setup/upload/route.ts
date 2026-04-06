import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse('Expected multipart/form-data', 400);
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') return errorResponse('No file uploaded', 400);

  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse('File type not allowed. Use PNG, JPG, WebP, GIF or PDF.', 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_SIZE) {
    return errorResponse('File exceeds 10 MB limit', 400);
  }

  const image = await prisma.dataImage.create({
    data: {
      userId:   user.sub,
      filename: file.name,
      mimetype: file.type,
      size:     buffer.byteLength,
      data:     buffer,
    },
    select: { id: true, filename: true, mimetype: true, size: true, createdAt: true },
  });

  return Response.json({ image }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return errorResponse('Missing id', 400);

  const image = await prisma.dataImage.findUnique({ where: { id } });
  if (!image || image.userId !== user.sub) return errorResponse('Not found', 404);

  await prisma.dataImage.delete({ where: { id } });
  return Response.json({ message: 'Deleted' });
}

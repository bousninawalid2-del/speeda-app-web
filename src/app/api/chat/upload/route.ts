import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/chat/upload
 *
 * Upload an image or voice file for use in chat.
 * Stores the file in DataImage and returns a servable URL.
 */

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav',
  'application/pdf',
];

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  if (!rateLimit(`chat-upload:${user.sub}`, { limit: 10, windowMs: 60_000 })) {
    return errorResponse('Too many uploads. Please wait a moment.', 429);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse('Expected multipart/form-data', 400);
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') return errorResponse('No file uploaded', 400);

  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse('File type not allowed. Use images, audio, or PDF.', 400);
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

  // Determine media type for chat payload
  let mediaType: 'image' | 'voice' | 'pdf' = 'image';
  if (file.type.startsWith('audio/')) mediaType = 'voice';
  else if (file.type === 'application/pdf') mediaType = 'pdf';

  return Response.json({
    id: image.id,
    mediaType,
    mediaUrl: `/api/chat/upload?id=${image.id}`,
    filename: image.filename,
  }, { status: 201 });
}

/**
 * GET /api/chat/upload?id=xxx
 *
 * Serve an uploaded file by its ID. Used by n8n to fetch media
 * and by the frontend to display uploaded images.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return errorResponse('Missing id', 400);

  const image = await prisma.dataImage.findUnique({ where: { id } });
  if (!image) return errorResponse('Not found', 404);

  return new Response(image.data, {
    headers: {
      'Content-Type':        image.mimetype,
      'Content-Disposition': `inline; filename="${image.filename}"`,
      'Cache-Control':       'public, max-age=3600',
    },
  });
}

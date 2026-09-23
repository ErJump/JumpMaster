/**
 * Serve le immagini degli handout. Accetta **solo** nomi generati dall'app (`<uuid>.<ext>`):
 * nessun percorso arbitrario può essere letto dal disco (SPEC-0008 AC14).
 */
import { readImage } from '@/features/player/uploads';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }): Promise<Response> {
  const { file } = await params;
  const image = await readImage(file);
  if (!image) return new Response('Non trovato', { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      'Content-Type': image.mime,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

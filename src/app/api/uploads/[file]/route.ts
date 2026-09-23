/**
 * Serve i file caricati: immagini di handout e mappe, tracce audio. Accetta **solo** nomi generati
 * dall'app (`<uuid>.<ext>`): nessun percorso arbitrario può essere letto dal disco (SPEC-0008 AC14).
 *
 * Rispetta le richieste `Range`: un elemento `<audio>` le usa per ricominciare una traccia in ciclo
 * senza riscaricarla tutta (SPEC-0016).
 */
import { readUpload } from '@/db/files';
import { byteRange } from '@/lib/byte-range';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }): Promise<Response> {
  const { file } = await params;
  const upload = await readUpload(file);
  if (!upload) return new Response('Non trovato', { status: 404 });

  const headers = {
    'Content-Type': upload.mime,
    'Cache-Control': 'private, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };
  const size = upload.bytes.length;
  const range = byteRange(request.headers.get('range'), size);

  if (range === 'unsatisfiable') return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } });
  if (range) {
    return new Response(new Uint8Array(upload.bytes.subarray(range.start, range.end + 1)), {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${range.start}-${range.end}/${size}`, 'Content-Length': String(range.end - range.start + 1) },
    });
  }
  return new Response(new Uint8Array(upload.bytes), { headers: { ...headers, 'Content-Length': String(size) } });
}

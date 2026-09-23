/**
 * Scarica e installa un manuale (SPEC-0015). Risponde con una riga JSON per ogni passo
 * (NDJSON): la pagina mostra l'avanzamento mentre le creature arrivano.
 */
import { downloadSource, type InstallEvent } from '@/features/sources/server';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }): Promise<Response> {
  if (!isSameOrigin(request)) return Response.json({ type: 'error', message: 'Richiesta non consentita.' }, { status: 403 });
  const { key } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(key)) return Response.json({ type: 'error', message: 'Manuale sconosciuto.' }, { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: InstallEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      await downloadSource(key, emit);
      controller.close();
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } });
}

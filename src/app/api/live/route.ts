/**
 * Stream della Vista Giocatori — ADR-0009.
 *
 * Ogni 500 ms ricalcola la vista pubblica e la invia **solo se è cambiata**. Si confronta la
 * vista già filtrata: le azioni riservate al DM non la cambiano, quindi non generano traffico.
 */
import { getActiveCampaign } from '@/features/campaigns/queries';
import { buildPlayerView } from '@/features/player/queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TICK_MS = 500;
const HEARTBEAT_MS = 15_000;

function currentView(): string {
  const campaign = getActiveCampaign();
  return JSON.stringify(buildPlayerView(campaign ? { id: campaign.id, name: campaign.name } : undefined));
}

export async function GET(request: Request): Promise<Response> {
  const encoder = new TextEncoder();
  let last = '';
  let closed = false;
  let tick: ReturnType<typeof setInterval> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stop = () => {
    closed = true;
    clearInterval(tick);
    clearInterval(heartbeat);
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          stop();
        }
      };

      const push = () => {
        try {
          const view = currentView();
          if (view !== last) {
            last = view;
            send(`data: ${view}\n\n`);
          }
        } catch {
          // Database occupato per un istante: si riprova al giro successivo.
        }
      };

      // Se la connessione cade, il browser riprova dopo 2 secondi (SPEC-0008 AC3).
      send('retry: 2000\n\n');
      push();
      tick = setInterval(push, TICK_MS);
      // Un commento periodico tiene viva la connessione attraverso proxy e sospensioni.
      heartbeat = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS);

      request.signal.addEventListener('abort', () => {
        stop();
        try {
          controller.close();
        } catch {
          // già chiuso
        }
      });
    },
    cancel: stop,
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * Importa una campagna (SPEC-0014). È una route e non una Server Action perché un archivio con
 * qualche mappa supera il limite di corpo delle Server Actions.
 *
 * Una route non ha i controlli d'origine delle Server Actions: li facciamo qui. Il corpo deve
 * essere `application/json` (una pagina esterna non può inviarlo senza un preflight, che fallisce)
 * e l'`Origin`, se c'è, deve essere questo stesso server.
 */
import { importArchive, MAX_ARCHIVE_BYTES } from '@/features/archive/server';

export const runtime = 'nodejs';

const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status });

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return fail('Richiesta non consentita.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return fail('Serve un file di campagna in formato JSON.', 415);

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_ARCHIVE_BYTES) return fail('Il file supera i 200 MB.', 413);

  const text = await request.text();
  if (text.length > MAX_ARCHIVE_BYTES) return fail('Il file supera i 200 MB.', 413);

  const result = await importArchive(text);
  return Response.json(result, { status: result.ok ? 200 : 422 });
}

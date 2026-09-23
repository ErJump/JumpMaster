/**
 * Carica una traccia d'atmosfera (SPEC-0016 AC6). Una route e non una Server Action: le tracce
 * superano il limite di corpo delle Server Actions (10 MB).
 */
import { getActiveCampaign } from '@/features/campaigns/queries';
import { addTrack, MAX_AUDIO_BYTES } from '@/features/ambience/server';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status });

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return fail('Richiesta non consentita.', 403);
  const campaign = getActiveCampaign();
  if (!campaign) return fail('Nessuna campagna attiva.', 409);

  if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 64 * 1024) return fail('La traccia supera i 40 MB.', 413);
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return fail('Nessun file ricevuto.', 400);
  if (file.size > MAX_AUDIO_BYTES) return fail('La traccia supera i 40 MB.', 413);

  const result = await addTrack(campaign.id, file.name, new Uint8Array(await file.arrayBuffer()));
  return Response.json(result, { status: result.ok ? 200 : 422 });
}

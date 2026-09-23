import 'server-only';
import { revalidatePath } from 'next/cache';
import { db } from '@/db/client';
import { ambienceTracks } from '@/db/schema';
import { MAX_AUDIO_BYTES, saveAudioBytes, uploadUrl } from '@/db/files';

export { MAX_AUDIO_BYTES };

/** Salva una traccia caricata dal DM (AC6): riconosciuta dai byte, nome del file deciso dall'app. */
export async function addTrack(
  campaignId: number,
  name: string,
  bytes: Uint8Array,
): Promise<{ ok: true; track: { id: number; name: string; url: string; sizeBytes: number } } | { ok: false; error: string }> {
  const saved = await saveAudioBytes(bytes);
  if (!saved.ok) return saved;
  const cleanName = name.replace(/\.[a-z0-9]{2,4}$/i, '').trim().slice(0, 80) || 'Traccia senza nome';
  const row = db
    .insert(ambienceTracks)
    .values({ campaignId, name: cleanName, file: saved.file, mime: saved.mime, sizeBytes: bytes.length })
    .returning({ id: ambienceTracks.id })
    .get();
  revalidatePath('/atmosfera');
  return { ok: true, track: { id: row.id, name: cleanName, url: uploadUrl(saved.file), sizeBytes: bytes.length } };
}

/**
 * L'archivio collegato all'app: il database vero e le immagini in `data/uploads/`.
 * La logica sta in `archive.ts`, che non sa nulla di Next e si prova su un database temporaneo.
 */
import 'server-only';
import { revalidatePath } from 'next/cache';
import { db } from '@/db/client';
import { deleteImage, readImage, saveImageBytes } from '@/db/files';
import { archiveFileName } from '@/core/archive';
import { exportCampaign, importCampaign, type ImageStore, type ImportResult } from './archive';
import { archiveSchema, describeArchiveError } from './schema';

/** Un archivio con qualche mappa pesa decine di MB; oltre questo è quasi certamente un errore. */
export const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;

const uploads: ImageStore = {
  read: async (name) => (await readImage(name))?.bytes ?? null,
  save: async (bytes) => {
    const saved = await saveImageBytes(bytes);
    return saved.ok ? saved.file : null;
  },
  remove: deleteImage,
};

export async function exportArchive(campaignId: number): Promise<{ fileName: string; body: string } | null> {
  const archive = await exportCampaign(db, campaignId, uploads);
  if (!archive) return null;
  return { fileName: archiveFileName(archive.campaign.name, new Date()), body: JSON.stringify(archive) };
}

export async function importArchive(text: string): Promise<ImportResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Il file non si legge: è danneggiato, o non è un file di campagna di JumpMaster.' };
  }

  const parsed = archiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: describeArchiveError(parsed.error) };

  const result = await importCampaign(db, parsed.data, uploads);
  if (result.ok) {
    revalidatePath('/campagne');
    revalidatePath('/archivio');
    revalidatePath('/');
  }
  return result;
}

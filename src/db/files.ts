/**
 * File caricati dal DM — immagini di handout e mappe — salvati in locale in `data/uploads/`.
 *
 * Sta nel livello di archiviazione condiviso (`src/db/`: database e file in `data/`) perché lo
 * usano più slice: `player` per gli handout, `maps` per le mappe (invariante I2).
 * `data/` è fuori da git: le immagini di una campagna restano sul PC del DM.
 */
import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { detectImageType, imageSize, UPLOAD_NAME, MIME_BY_EXT, type ImageType } from '@/lib/image-type';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const UPLOAD_DIR = process.env.JUMPMASTER_UPLOADS ?? resolve(/* turbopackIgnore: true */ process.cwd(), 'data/uploads');

/**
 * L'unico punto che compone un percorso su disco per le immagini.
 *
 * Il commento `turbopackIgnore` dice al tracciamento dei file di Next di non seguire questo
 * percorso: è deciso a runtime, e senza l'indicazione il bundler includerebbe per prudenza
 * l'intero progetto nell'output del server.
 */
function uploadPath(name: string): string {
  return join(/* turbopackIgnore: true */ UPLOAD_DIR, name);
}

export type SaveResult = { ok: true; file: string; width: number | null; height: number | null } | { ok: false; error: string };

export async function saveImage(file: File): Promise<SaveResult> {
  if (file.size === 0) return { ok: false, error: 'Il file è vuoto.' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'L’immagine supera i 10 MB.' };
  return saveImageBytes(new Uint8Array(await file.arrayBuffer()));
}

/**
 * Salva un'immagine già in memoria, ad esempio rientrata da un archivio (SPEC-0014). Stessi
 * controlli di `saveImage`: il tipo si riconosce dai byte, il nome lo decide l'app.
 */
export async function saveImageBytes(bytes: Uint8Array): Promise<SaveResult> {
  if (bytes.length === 0) return { ok: false, error: 'Il file è vuoto.' };
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: 'L’immagine supera i 10 MB.' };
  const type = detectImageType(bytes);
  if (!type) return { ok: false, error: 'Formato non supportato: usa PNG, JPEG, WebP o GIF.' };

  // Il nome sul disco lo genera l'app: quello scelto dall'utente non tocca mai il filesystem.
  const name = `${randomUUID()}.${type.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(uploadPath(name), bytes);
  const size = imageSize(bytes);
  return { ok: true, file: name, width: size?.width ?? null, height: size?.height ?? null };
}

export async function readImage(name: string): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!UPLOAD_NAME.test(name)) return null;
  try {
    const bytes = await readFile(uploadPath(name));
    const ext = name.split('.').pop() as ImageType['ext'];
    return { bytes, mime: MIME_BY_EXT[ext] };
  } catch {
    return null;
  }
}

export async function deleteImage(name: string | null): Promise<void> {
  if (!name || !UPLOAD_NAME.test(name)) return;
  await unlink(uploadPath(name)).catch(() => undefined);
}

export const imageUrl = (name: string | null): string | null => (name ? `/api/uploads/${name}` : null);

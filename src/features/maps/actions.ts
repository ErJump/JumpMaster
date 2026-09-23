'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/db/client';
import { maps } from '@/db/schema';
import { deleteImage, saveImage } from '@/db/files';
import { fogSchema, pinsSchema, tokensSchema } from '@/db/schema/json';

export interface NewMapState {
  error?: string;
}

const newMapSchema = z.object({
  name: z.string().trim().min(1, 'Dai un nome alla mappa.').max(120, 'Nome troppo lungo.'),
  kind: z.enum(['battle', 'world']),
});

export async function createMap(campaignId: number, _previous: NewMapState, formData: FormData): Promise<NewMapState> {
  const parsed = newMapSchema.safeParse({ name: formData.get('name') ?? '', kind: formData.get('kind') ?? 'battle' });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const image = formData.get('image');
  if (!(image instanceof File) || image.size === 0) return { error: 'Scegli l’immagine della mappa.' };

  const saved = await saveImage(image);
  if (!saved.ok) return { error: saved.error };
  if (!saved.width || !saved.height) {
    await deleteImage(saved.file);
    return { error: 'Non riesco a leggere le dimensioni dell’immagine.' };
  }

  const now = new Date();
  const created = db
    .insert(maps)
    .values({
      ...parsed.data,
      campaignId,
      imageFile: saved.file,
      imageWidth: saved.width,
      imageHeight: saved.height,
      // Una casella di partenza sensata: circa venti colonne sulla larghezza dell'immagine.
      gridSize: Math.max(20, Math.round(saved.width / 20)),
      showGrid: parsed.data.kind === 'battle',
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: maps.id })
    .get();

  revalidatePath('/mappe');
  redirect(`/mappe/${created?.id}`);
}

const mapStateSchema = z.object({
  gridSize: z.number().int().min(10).max(600),
  gridOffsetX: z.number().int().min(0).max(600),
  gridOffsetY: z.number().int().min(0).max(600),
  showGrid: z.boolean(),
  fog: fogSchema,
  tokens: tokensSchema,
  pins: pinsSchema,
});

export type MapState = z.infer<typeof mapStateSchema>;

/** Salvataggio automatico dell'editor: griglia, nebbia, segnalini e segnaposto, validati al confine. */
export async function saveMapState(id: number, raw: unknown): Promise<{ error?: string }> {
  const parsed = mapStateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Stato della mappa non valido.' };
  db.update(maps).set({ ...parsed.data, updatedAt: new Date() }).where(eq(maps.id, id)).run();
  // Niente revalidate: l'editor ha già lo stato, e la Vista Giocatori legge dal database via SSE.
  return {};
}

export async function renameMap(id: number, name: string): Promise<{ error?: string }> {
  const parsed = newMapSchema.shape.name.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  db.update(maps).set({ name: parsed.data, updatedAt: new Date() }).where(eq(maps.id, id)).run();
  revalidatePath('/mappe', 'layout');
  return {};
}

export async function deleteMap(id: number): Promise<void> {
  const map = db.select().from(maps).where(eq(maps.id, id)).get();
  db.delete(maps).where(eq(maps.id, id)).run();
  await deleteImage(map?.imageFile ?? null);
  revalidatePath('/mappe');
  redirect('/mappe');
}

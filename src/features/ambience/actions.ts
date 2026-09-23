'use server';

import { and, eq, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db/client';
import { ambienceScenes, ambienceTracks } from '@/db/schema';
import { layersSchema } from '@/db/schema/json';
import { deleteAudio } from '@/db/files';
import { BASE_SCENES, type Layer } from '@/core/ambience';

const refresh = () => revalidatePath('/atmosfera');

function nextPosition(campaignId: number): number {
  const row = db.select({ last: max(ambienceScenes.position) }).from(ambienceScenes).where(eq(ambienceScenes.campaignId, campaignId)).get();
  return (row?.last ?? -1) + 1;
}

/** Le scene di base (AC1): si aggiungono a quelle che ci sono, senza doppioni di nome. */
export async function createBaseScenes(campaignId: number): Promise<void> {
  const existing = new Set(
    db.select({ name: ambienceScenes.name }).from(ambienceScenes).where(eq(ambienceScenes.campaignId, campaignId)).all().map((s) => s.name),
  );
  let position = nextPosition(campaignId);
  const missing = BASE_SCENES.filter((scene) => !existing.has(scene.name));
  if (missing.length) {
    db.insert(ambienceScenes)
      .values(missing.map((scene) => ({ campaignId, name: scene.name, icon: scene.icon, layers: scene.layers, position: position++ })))
      .run();
  }
  refresh();
}

const sceneMetaSchema = z.object({
  name: z.string().trim().min(1, 'Serve un nome.').max(80, 'Nome troppo lungo.'),
  icon: z.string().trim().min(1).max(16).default('🎵'),
});

export async function createScene(campaignId: number, raw: unknown): Promise<{ id?: number; error?: string }> {
  const parsed = sceneMetaSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const row = db
    .insert(ambienceScenes)
    .values({ campaignId, ...parsed.data, layers: [], position: nextPosition(campaignId) })
    .returning({ id: ambienceScenes.id })
    .get();
  refresh();
  return { id: row.id };
}

export async function renameScene(id: number, raw: unknown): Promise<{ error?: string }> {
  const parsed = sceneMetaSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  db.update(ambienceScenes).set({ ...parsed.data, updatedAt: new Date() }).where(eq(ambienceScenes.id, id)).run();
  refresh();
  return {};
}

/** Salvataggio automatico degli strati mentre il DM li regola. */
export async function saveSceneLayers(id: number, raw: unknown): Promise<{ error?: string }> {
  const parsed = layersSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Strati non validi.' };
  const scene = db.select({ campaignId: ambienceScenes.campaignId }).from(ambienceScenes).where(eq(ambienceScenes.id, id)).get();
  if (!scene) return { error: 'Scena sparita.' };
  // Una traccia di un'altra campagna non può finire in questa scena.
  const own = new Set(
    db.select({ id: ambienceTracks.id }).from(ambienceTracks).where(eq(ambienceTracks.campaignId, scene.campaignId)).all().map((t) => t.id),
  );
  const layers = parsed.data.filter((layer) => layer.kind !== 'track' || own.has(layer.trackId));
  db.update(ambienceScenes).set({ layers, updatedAt: new Date() }).where(eq(ambienceScenes.id, id)).run();
  return {};
}

export async function deleteScene(id: number): Promise<void> {
  db.delete(ambienceScenes).where(eq(ambienceScenes.id, id)).run();
  refresh();
}

/** Elimina una traccia: il suo file (I8) e gli strati che la usavano. */
export async function deleteTrack(id: number): Promise<void> {
  const track = db.select().from(ambienceTracks).where(eq(ambienceTracks.id, id)).get();
  if (!track) return;
  db.transaction((tx) => {
    const scenes = tx.select().from(ambienceScenes).where(eq(ambienceScenes.campaignId, track.campaignId)).all();
    for (const scene of scenes) {
      const layers = (scene.layers as Layer[]).filter((layer) => !(layer.kind === 'track' && layer.trackId === id));
      if (layers.length !== (scene.layers as Layer[]).length) {
        tx.update(ambienceScenes).set({ layers, updatedAt: new Date() }).where(eq(ambienceScenes.id, scene.id)).run();
      }
    }
    tx.delete(ambienceTracks).where(and(eq(ambienceTracks.id, id), eq(ambienceTracks.campaignId, track.campaignId))).run();
  });
  await deleteAudio(track.file);
  refresh();
}

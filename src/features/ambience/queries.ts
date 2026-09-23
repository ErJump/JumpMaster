import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { ambienceScenes, ambienceTracks } from '@/db/schema';
import { layersSchema } from '@/db/schema/json';
import { uploadUrl } from '@/db/files';
import type { Layer } from '@/core/ambience';

export interface SceneView {
  id: number;
  name: string;
  icon: string;
  layers: Layer[];
}

export interface TrackView {
  id: number;
  name: string;
  url: string;
  sizeBytes: number;
}

export function listScenes(campaignId: number): SceneView[] {
  return db
    .select()
    .from(ambienceScenes)
    .where(eq(ambienceScenes.campaignId, campaignId))
    .orderBy(asc(ambienceScenes.position), asc(ambienceScenes.id))
    .all()
    .map((scene) => {
      // Uno strato illeggibile non deve rompere la pagina: la scena resta, senza strati.
      const layers = layersSchema.safeParse(scene.layers);
      return { id: scene.id, name: scene.name, icon: scene.icon, layers: layers.success ? layers.data : [] };
    });
}

export function listTracks(campaignId: number): TrackView[] {
  return db
    .select()
    .from(ambienceTracks)
    .where(eq(ambienceTracks.campaignId, campaignId))
    .orderBy(asc(ambienceTracks.name))
    .all()
    .map((track) => ({ id: track.id, name: track.name, url: uploadUrl(track.file), sizeBytes: track.sizeBytes }));
}

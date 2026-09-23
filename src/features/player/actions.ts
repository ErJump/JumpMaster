'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db/client';
import { handouts, liveState } from '@/db/schema';
import { saveImage, deleteImage } from './uploads';
import type { LiveMode } from './types';

function upsertLive(campaignId: number, values: Partial<{ mode: LiveMode; handoutId: number | null; lastRoll: unknown }>) {
  db.insert(liveState)
    .values({ campaignId, ...values, updatedAt: new Date() })
    .onConflictDoUpdate({ target: liveState.campaignId, set: { ...values, updatedAt: new Date() } })
    .run();
  revalidatePath('/regia');
}

export async function setLiveMode(campaignId: number, mode: 'auto' | 'blackout'): Promise<void> {
  upsertLive(campaignId, { mode, handoutId: null });
}

export async function showHandout(campaignId: number, handoutId: number): Promise<void> {
  upsertLive(campaignId, { mode: 'handout', handoutId });
}

export interface HandoutFormState {
  error?: string;
  message?: string;
}

const handoutSchema = z.object({
  title: z.string().trim().min(1, 'Dai un titolo all’handout.').max(160, 'Titolo troppo lungo.'),
  body: z.string().trim().max(20000, 'Testo troppo lungo.').default(''),
});

export async function createHandout(
  campaignId: number,
  _previous: HandoutFormState,
  formData: FormData,
): Promise<HandoutFormState> {
  const parsed = handoutSchema.safeParse({ title: formData.get('title') ?? '', body: formData.get('body') ?? '' });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  let imageFile: string | null = null;
  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    const saved = await saveImage(image);
    if (!saved.ok) return { error: saved.error };
    imageFile = saved.file;
  }

  const now = new Date();
  db.insert(handouts).values({ ...parsed.data, imageFile, campaignId, createdAt: now, updatedAt: now }).run();
  revalidatePath('/regia');
  return { message: 'Handout pronto.' };
}

export async function deleteHandout(id: number): Promise<void> {
  const handout = db.select().from(handouts).where(eq(handouts.id, id)).get();
  if (!handout) return;
  // Se era in mostra, la regia torna in automatico da sola (ON DELETE SET NULL + fallback).
  db.delete(handouts).where(eq(handouts.id, id)).run();
  await deleteImage(handout.imageFile);
  revalidatePath('/regia');
}

const rollSchema = z.string().trim().min(1).max(300);

/** Tiro pubblico dalla pagina dei dadi (SPEC-0008 AC15). I tiri segreti non arrivano mai qui. */
export async function publishRoll(campaignId: number, text: string): Promise<void> {
  const parsed = rollSchema.safeParse(text);
  if (!parsed.success) return;
  upsertLive(campaignId, { lastRoll: { text: parsed.data, at: Date.now() } });
}

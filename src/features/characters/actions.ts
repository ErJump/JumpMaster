'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/db/client';
import { characters } from '@/db/schema';
import { parseCharacterForm } from './schema';

export interface FormState {
  errors?: Record<string, string>;
  message?: string;
}

function collectErrors(issues: Array<{ path: PropertyKey[]; message: string }>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'form');
    errors[field] ??= issue.message;
  }
  return errors;
}

function refresh(): void {
  revalidatePath('/personaggi');
  revalidatePath('/gruppo');
  revalidatePath('/');
}

export async function createCharacter(
  campaignId: number,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseCharacterForm(formData);
  if (!parsed.success) return { errors: collectErrors(parsed.error.issues) };

  const now = new Date();
  const created = db
    .insert(characters)
    .values({ ...parsed.data, campaignId, createdAt: now, updatedAt: now })
    .returning({ id: characters.id })
    .get();

  refresh();
  redirect(`/personaggi/${created?.id}`);
}

export async function updateCharacter(id: number, _previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseCharacterForm(formData);
  if (!parsed.success) return { errors: collectErrors(parsed.error.issues) };

  db.update(characters)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(characters.id, id))
    .run();

  refresh();
  revalidatePath(`/personaggi/${id}`);
  return { message: 'Salvato.' };
}

export async function deleteCharacter(id: number): Promise<void> {
  db.delete(characters).where(eq(characters.id, id)).run();
  refresh();
  redirect('/personaggi');
}

const generatedNpcSchema = z.object({
  name: z.string().trim().min(1).max(120),
  ancestry: z.string().trim().max(40),
  occupation: z.string().trim().max(120),
  appearance: z.string().trim().max(500),
  manner: z.string().trim().max(500),
  want: z.string().trim().max(500),
  secret: z.string().trim().max(500),
  voice: z.string().trim().max(500),
});

/** Salva un PNG uscito dal generatore (SPEC-0011 AC3). Il segreto va nel campo riservato. */
export async function createNpcFromGenerator(campaignId: number, raw: unknown): Promise<{ id?: number; error?: string }> {
  const parsed = generatedNpcSchema.safeParse(raw);
  if (!parsed.success) return { error: 'PNG non valido.' };
  const npc = parsed.data;
  const now = new Date();
  const created = db
    .insert(characters)
    .values({
      campaignId,
      kind: 'npc',
      name: npc.name,
      role: `${npc.ancestry} ${npc.occupation}`.trim(),
      appearance: npc.appearance,
      voice: `${npc.voice}; ${npc.manner}`,
      secret: npc.secret,
      notes: `Cosa vuole: ${npc.want}.`,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: characters.id })
    .get();
  refresh();
  return { id: created?.id };
}

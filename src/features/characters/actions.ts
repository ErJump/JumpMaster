'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

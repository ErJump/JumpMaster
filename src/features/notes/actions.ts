'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { notes } from '@/db/schema';
import { renameLinksEverywhere } from '@/db/queries/links';
import { linkKey } from '@/lib/wikilinks';
import { noteSchema } from './schema';

export interface NoteFormState {
  errors?: Record<string, string>;
  message?: string;
}

function parse(formData: FormData) {
  return noteSchema.safeParse({
    title: formData.get('title') ?? '',
    kind: formData.get('kind') ?? 'other',
    body: formData.get('body') ?? '',
  });
}

/**
 * Due note con lo stesso titolo renderebbero ambiguo ogni `[[Titolo]]`: quale delle due?
 * Si confronta la chiave (maiuscole e accenti non contano).
 */
function titleTaken(campaignId: number, title: string, exceptId?: number): boolean {
  const rows = db
    .select({ title: notes.title })
    .from(notes)
    .where(exceptId === undefined ? eq(notes.campaignId, campaignId) : and(eq(notes.campaignId, campaignId), ne(notes.id, exceptId)))
    .all();
  return rows.some((row) => linkKey(row.title) === linkKey(title));
}

export async function createNote(campaignId: number, _previous: NoteFormState, formData: FormData): Promise<NoteFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { errors: { [String(parsed.error.issues[0]?.path[0] ?? 'form')]: parsed.error.issues[0]?.message ?? '' } };
  if (titleTaken(campaignId, parsed.data.title)) return { errors: { title: 'Esiste già una nota con questo titolo.' } };

  const now = new Date();
  const created = db.insert(notes).values({ ...parsed.data, campaignId, createdAt: now, updatedAt: now }).returning({ id: notes.id }).get();
  revalidatePath('/note');
  redirect(`/note/${created?.id}`);
}

export async function updateNote(id: number, _previous: NoteFormState, formData: FormData): Promise<NoteFormState> {
  const current = db.select().from(notes).where(eq(notes.id, id)).get();
  if (!current) return { errors: { form: 'La nota non esiste più.' } };

  const parsed = parse(formData);
  if (!parsed.success) return { errors: { [String(parsed.error.issues[0]?.path[0] ?? 'form')]: parsed.error.issues[0]?.message ?? '' } };
  if (titleTaken(current.campaignId, parsed.data.title, id)) return { errors: { title: 'Esiste già una nota con questo titolo.' } };

  db.update(notes).set({ ...parsed.data, updatedAt: new Date() }).where(eq(notes.id, id)).run();

  // Rinominata: i collegamenti che la citavano la seguono, invece di rompersi (SPEC-0009 AC6).
  if (linkKey(current.title) !== linkKey(parsed.data.title)) {
    renameLinksEverywhere(current.campaignId, current.title, parsed.data.title);
  }

  revalidatePath('/note', 'layout');
  redirect(`/note/${id}`);
}

export async function deleteNote(id: number): Promise<void> {
  db.delete(notes).where(eq(notes.id, id)).run();
  revalidatePath('/note', 'layout');
  redirect('/note');
}

/**
 * Crea una nota da un generatore (SPEC-0011 AC4). Se il titolo è già preso non si rifiuta: si
 * aggiunge un numero, perché chi rigenera la stessa taverna due volte vuole due note, non un errore.
 */
export async function createNoteFromGenerator(
  campaignId: number,
  raw: { title: string; kind: string; body: string },
): Promise<{ id?: number; error?: string }> {
  const parsed = noteSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Nota non valida.' };

  let title = parsed.data.title;
  for (let n = 2; titleTaken(campaignId, title); n++) title = `${parsed.data.title} (${n})`;

  const now = new Date();
  const created = db
    .insert(notes)
    .values({ ...parsed.data, title, campaignId, createdAt: now, updatedAt: now })
    .returning({ id: notes.id })
    .get();
  revalidatePath('/note', 'layout');
  return { id: created?.id };
}

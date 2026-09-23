'use server';

import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { encounters, encounterMonsters, srdMonsters } from '@/db/schema';
import { abilityModifier } from '@/core/rules';
import { encounterMetaSchema, encounterMonstersSchema } from './schema';

export interface FormState {
  errors?: Record<string, string>;
  message?: string;
}

function refresh(id?: number): void {
  revalidatePath('/scontri');
  if (id !== undefined) revalidatePath(`/scontri/${id}`);
}

export async function createEncounter(campaignId: number, _previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = encounterMetaSchema.safeParse({
    name: formData.get('name') ?? '',
    description: formData.get('description') ?? '',
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) {
    return { errors: { [String(parsed.error.issues[0]?.path[0] ?? 'form')]: parsed.error.issues[0]?.message ?? '' } };
  }

  const now = new Date();
  const created = db
    .insert(encounters)
    .values({ ...parsed.data, campaignId, createdAt: now, updatedAt: now })
    .returning({ id: encounters.id })
    .get();

  refresh();
  redirect(`/scontri/${created?.id}`);
}

export async function updateEncounterMeta(id: number, _previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = encounterMetaSchema.safeParse({
    name: formData.get('name') ?? '',
    description: formData.get('description') ?? '',
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) {
    return { errors: { [String(parsed.error.issues[0]?.path[0] ?? 'form')]: parsed.error.issues[0]?.message ?? '' } };
  }

  db.update(encounters).set({ ...parsed.data, updatedAt: new Date() }).where(eq(encounters.id, id)).run();
  refresh(id);
  return { message: 'Salvato.' };
}

/**
 * Sostituisce l'elenco dei mostri dello scontro.
 *
 * Il client manda solo `{ slug, count }`; tutto il resto si rilegge dall'SRD qui, lato server.
 * Il salvataggio è immediato a ogni modifica: su SQLite locale costa un millisecondo, e toglie
 * al DM il rischio di chiudere la pagina dimenticando di salvare.
 */
export async function saveEncounterMonsters(id: number, entries: unknown): Promise<{ error?: string }> {
  const parsed = encounterMonstersSchema.safeParse(entries);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Elenco non valido.' };

  const slugs = [...new Set(parsed.data.map((entry) => entry.slug))];
  const known =
    slugs.length === 0
      ? []
      : db.select().from(srdMonsters).where(inArray(srdMonsters.slug, slugs)).all();
  const bySlug = new Map(known.map((monster) => [monster.slug, monster]));

  const rows = parsed.data.flatMap((entry) => {
    const monster = bySlug.get(entry.slug);
    if (!monster) return []; // mostro inesistente: scartato, non inventato
    const data = monster.data as { dexterity?: number };
    return [
      {
        encounterId: id,
        srdMonsterSlug: monster.slug,
        count: entry.count,
        name: monster.name,
        cr: monster.crLabel,
        xp: monster.xp,
        hp: monster.hp,
        ac: monster.ac,
        initiativeMod: abilityModifier(data.dexterity ?? 10),
        hitDice: monster.hitDice,
      },
    ];
  });

  db.transaction((tx) => {
    tx.delete(encounterMonsters).where(eq(encounterMonsters.encounterId, id)).run();
    if (rows.length > 0) tx.insert(encounterMonsters).values(rows).run();
    tx.update(encounters).set({ updatedAt: new Date() }).where(eq(encounters.id, id)).run();
  });

  refresh(id);
  return {};
}

export async function deleteEncounter(id: number): Promise<void> {
  db.delete(encounters).where(eq(encounters.id, id)).run();
  refresh();
  redirect('/scontri');
}

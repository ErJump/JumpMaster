'use server';

import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { encounters, sessions } from '@/db/schema';
import { loadCombatEvents } from '@/db/queries/combat-log';
import { carryOverSecrets, emptyPrep } from '@/core/sessions';
import { reduceCombat, summarizeCombat } from '@/core/events';
import { readPrep, sessionMetaSchema, sessionPrepSchema } from './schema';
import { nextSession } from './queries';

/**
 * Nuova sessione, col numero successivo. I segreti non rivelati dell'ultima vengono proposti da
 * soli (SPEC-0010 AC4): nel metodo Lazy DM restano validi finché non vengono scoperti.
 */
export async function createSession(campaignId: number): Promise<void> {
  const last = db.select().from(sessions).where(eq(sessions.campaignId, campaignId)).orderBy(desc(sessions.number)).get();

  const prep = { ...emptyPrep(), secrets: carryOverSecrets(last ? readPrep(last.prep) : null) };
  const now = new Date();
  const created = db
    .insert(sessions)
    .values({ campaignId, number: (last?.number ?? 0) + 1, prep, createdAt: now, updatedAt: now })
    .returning({ id: sessions.id })
    .get();

  revalidatePath('/sessioni');
  redirect(`/sessioni/${created?.id}/prepara`);
}

export interface MetaState {
  error?: string;
  message?: string;
}

export async function updateSessionMeta(id: number, _previous: MetaState, formData: FormData): Promise<MetaState> {
  const parsed = sessionMetaSchema.safeParse({ title: formData.get('title') ?? '', playedOn: formData.get('playedOn') ?? '' });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  db.update(sessions).set({ ...parsed.data, updatedAt: new Date() }).where(eq(sessions.id, id)).run();
  revalidatePath('/sessioni', 'layout');
  return { message: 'Salvato.' };
}

/** Salvataggio automatico della preparazione (AC10): validata al confine, come ogni input. */
export async function saveSessionPrep(id: number, raw: unknown): Promise<{ error?: string }> {
  const parsed = sessionPrepSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Preparazione non valida.' };
  db.update(sessions).set({ prep: parsed.data, updatedAt: new Date() }).where(eq(sessions.id, id)).run();
  revalidatePath(`/sessioni/${id}`);
  revalidatePath('/sessioni');
  return {};
}

/** Spunta un segreto come rivelato, anche a metà partita dalla vista «al tavolo». */
export async function toggleSecret(id: number, secretId: string, revealed: boolean): Promise<void> {
  const session = db.select().from(sessions).where(eq(sessions.id, id)).get();
  if (!session) return;
  const prep = readPrep(session.prep);
  prep.secrets = prep.secrets.map((s) => (s.id === secretId ? { ...s, revealed } : s));
  db.update(sessions).set({ prep, updatedAt: new Date() }).where(eq(sessions.id, id)).run();
  revalidatePath(`/sessioni/${id}`);
  revalidatePath('/sessioni');
}

export async function saveJournal(id: number, journal: string): Promise<{ error?: string }> {
  if (journal.length > 200_000) return { error: 'Il diario è troppo lungo.' };
  db.update(sessions).set({ journal, updatedAt: new Date() }).where(eq(sessions.id, id)).run();
  revalidatePath(`/sessioni/${id}`);
  return {};
}

/**
 * Bozza dal registro (SPEC-0010 AC7): il riassunto dei combattimenti conclusi fra l'inizio di
 * questa sessione e l'inizio della successiva (o adesso). È la promessa di ADR-0005: il registro
 * degli eventi diventa il diario.
 */
export async function combatDraft(id: number): Promise<{ draft: string | null; message: string }> {
  const session = db.select().from(sessions).where(eq(sessions.id, id)).get();
  if (!session) return { draft: null, message: 'Sessione non trovata.' };

  const until = nextSession(session)?.createdAt ?? new Date(Date.now() + 1000);
  const done = db
    .select()
    .from(encounters)
    .where(
      and(
        eq(encounters.campaignId, session.campaignId),
        eq(encounters.status, 'done'),
        gte(encounters.updatedAt, session.createdAt),
        lt(encounters.updatedAt, until),
      ),
    )
    .all();

  if (done.length === 0) {
    return { draft: null, message: 'Nessun combattimento concluso dall’inizio di questa sessione.' };
  }

  const parts = done.map((encounter) =>
    summarizeCombat(reduceCombat(loadCombatEvents(encounter.id).map(({ event }) => event)), encounter.name),
  );
  return { draft: parts.join('\n\n'), message: `${done.length} ${done.length === 1 ? 'combattimento riassunto' : 'combattimenti riassunti'}.` };
}

export async function deleteSession(id: number): Promise<void> {
  db.delete(sessions).where(eq(sessions.id, id)).run();
  revalidatePath('/sessioni');
  redirect('/sessioni');
}

/**
 * Collegamenti `[[…]]` attraverso le tabelle della campagna: note, sessioni, personaggi.
 *
 * Sta nel livello dati condiviso (invariante I7) perché riguarda più slice: le note li scrivono,
 * le sessioni pure, e i personaggi possono esserne la destinazione.
 */
import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '../client';
import { characters, notes, sessions } from '../schema';
import { linksTo, linkKey, renameLinks, type LinkTargets } from '@/lib/wikilinks';

export { resolveLinkIn } from '@/lib/wikilinks';

/** Ciò a cui un collegamento può puntare, nella campagna data. */
export function linkTargets(campaignId: number): LinkTargets {
  return {
    notes: db.select({ id: notes.id, title: notes.title }).from(notes).where(eq(notes.campaignId, campaignId)).all(),
    characters: db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(eq(characters.campaignId, campaignId))
      .all(),
  };
}

/** Chi cita un titolo: note e sessioni (SPEC-0009 AC5). */
export function mentionsOf(
  campaignId: number,
  title: string,
): { notes: Array<{ id: number; title: string }>; sessions: Array<{ id: number; number: number; title: string }> } {
  const noteRows = db.select().from(notes).where(eq(notes.campaignId, campaignId)).all();
  const sessionRows = db.select().from(sessions).where(eq(sessions.campaignId, campaignId)).all();

  return {
    notes: noteRows
      .filter((n) => linkKey(n.title) !== linkKey(title) && linksTo(n.body, title))
      .map((n) => ({ id: n.id, title: n.title })),
    sessions: sessionRows
      .filter((s) => linksTo(`${JSON.stringify(s.prep)}\n${s.journal}`, title))
      .map((s) => ({ id: s.id, number: s.number, title: s.title })),
  };
}

/** Applica `renameLinks` a ogni stringa di una struttura JSON, senza toccarne la forma. */
function renameDeep(value: unknown, from: string, to: string): unknown {
  if (typeof value === 'string') return renameLinks(value, from, to);
  if (Array.isArray(value)) return value.map((item) => renameDeep(item, from, to));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, renameDeep(v, from, to)]));
  }
  return value;
}

/**
 * Dopo la rinomina di una nota, riscrive i collegamenti **ovunque** nella campagna (SPEC-0009 AC6),
 * in una sola transazione: o si aggiornano tutti, o nessuno.
 */
export function renameLinksEverywhere(campaignId: number, from: string, to: string): void {
  db.transaction((tx) => {
    for (const note of tx.select().from(notes).where(eq(notes.campaignId, campaignId)).all()) {
      const body = renameLinks(note.body, from, to);
      if (body !== note.body) tx.update(notes).set({ body }).where(and(eq(notes.id, note.id))).run();
    }
    for (const session of tx.select().from(sessions).where(eq(sessions.campaignId, campaignId)).all()) {
      const journal = renameLinks(session.journal, from, to);
      const prep = renameDeep(session.prep, from, to);
      if (journal !== session.journal || JSON.stringify(prep) !== JSON.stringify(session.prep)) {
        tx.update(sessions).set({ journal, prep }).where(eq(sessions.id, session.id)).run();
      }
    }
  });
}

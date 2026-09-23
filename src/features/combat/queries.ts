import 'server-only';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { combatEvents, encounters, srdMonsters, type Encounter } from '@/db/schema';
import type { CombatEvent } from '@/core/events';
import type { SrdMonsterData } from '@/lib/srd-types';

/** Un evento del registro, con l'indicazione se appartiene alla preparazione iniziale. */
export interface StoredCombatEvent {
  event: CombatEvent;
  /**
   * Gli eventi scritti da `startCombat` — avvio e ingresso dei combattenti — non si annullano:
   * annullandoli sparirebbero i combattenti stessi, che non è mai ciò che il DM intende.
   */
  setup: boolean;
}

/** Gli eventi attivi, nell'ordine in cui sono avvenuti. Gli annullati restano fuori. */
export function loadCombatEvents(encounterId: number): StoredCombatEvent[] {
  return db
    .select({ payload: combatEvents.payload })
    .from(combatEvents)
    .where(and(eq(combatEvents.encounterId, encounterId), isNull(combatEvents.undoneAt)))
    .orderBy(asc(combatEvents.seq))
    .all()
    .map(({ payload }) => {
      const { setup, ...event } = payload as CombatEvent & { setup?: boolean };
      return { event: event as CombatEvent, setup: setup === true };
    });
}

export function getCombatEncounter(id: number): Encounter | undefined {
  return db.select().from(encounters).where(eq(encounters.id, id)).get();
}

/** Lo scontro in corso nella campagna, se ce n'è uno. */
export function runningEncounter(campaignId: number): Encounter | undefined {
  return db
    .select()
    .from(encounters)
    .where(and(eq(encounters.campaignId, campaignId), eq(encounters.status, 'running')))
    .get();
}

/** Gli stat block dei mostri in campo, per consultarli senza uscire dal combattimento (AC16). */
export function statBlocksFor(slugs: string[]): Record<string, SrdMonsterData> {
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return {};
  return Object.fromEntries(
    db
      .select({ slug: srdMonsters.slug, data: srdMonsters.data })
      .from(srdMonsters)
      .where(inArray(srdMonsters.slug, unique))
      .all()
      .map((row) => [row.slug, row.data as SrdMonsterData]),
  );
}

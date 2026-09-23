import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { encounters, srdMonsters, type Encounter } from '@/db/schema';
import type { SrdMonsterData } from '@/lib/srd-types';

// La lettura del registro è condivisa con la Vista Giocatori: vive nel livello dati.
export { loadCombatEvents, type StoredCombatEvent } from '@/db/queries/combat-log';

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

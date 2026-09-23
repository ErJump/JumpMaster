/**
 * Installare e rimuovere un manuale Open5e (SPEC-0015). Il database arriva come parametro:
 * il test gira su un SQLite vero, con le migrazioni reali.
 */
import { count, eq, inArray, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import type { DownloadedDocument } from '@/content/open5e/api';
import { toMonsterRow, type Open5eMonsterRow } from '@/content/open5e/normalize';

const { open5eDocuments, open5eLicenses, open5eMonsters, encounterMonsters, encounters, characters } = schema;

export type SourcesDb = BetterSQLite3Database<typeof schema>;

const CHUNK = 100;

/**
 * Scrive un manuale scaricato. Tutto è già convertito **prima** della transazione; dentro, il
 * manuale vecchio (se c'è) sparisce a cascata e il nuovo prende il suo posto (AC7, AC8).
 */
export function installDocument(db: SourcesDb, downloaded: DownloadedDocument): number {
  const rows: Open5eMonsterRow[] = downloaded.creatures.map(toMonsterRow);
  const { document } = downloaded;

  db.transaction((tx) => {
    for (const license of downloaded.licenses) {
      tx.insert(open5eLicenses)
        .values({ key: license.key, name: license.name, text: license.desc })
        .onConflictDoUpdate({ target: open5eLicenses.key, set: { name: license.name, text: license.desc } })
        .run();
    }
    tx.delete(open5eDocuments).where(eq(open5eDocuments.key, document.key)).run();
    tx.insert(open5eDocuments)
      .values({
        key: document.key,
        name: document.display_name || document.name,
        publisher: document.publisher.name,
        permalink: document.permalink ?? null,
        licenses: document.licenses.map((l) => l.key),
        monsterCount: rows.length,
        importedAt: new Date(),
      })
      .run();
    for (let i = 0; i < rows.length; i += CHUNK) tx.insert(open5eMonsters).values(rows.slice(i, i + CHUNK)).run();
  });

  return rows.length;
}

export interface DocumentUsage {
  /** Scontri che contengono almeno un mostro del manuale. */
  encounters: number;
  /** PNG il cui stat block viene dal manuale. */
  characters: number;
}

/** Quanto la campagna usa un manuale: il DM lo sa prima di rimuoverlo (AC6). */
export function documentUsage(db: SourcesDb, key: string): DocumentUsage {
  const slugs = db.select({ slug: open5eMonsters.slug }).from(open5eMonsters).where(eq(open5eMonsters.documentKey, key));
  const usedEncounters =
    db
      .select({ n: sql<number>`count(distinct ${encounters.id})` })
      .from(encounterMonsters)
      .innerJoin(encounters, eq(encounters.id, encounterMonsters.encounterId))
      .where(inArray(encounterMonsters.srdMonsterSlug, slugs))
      .get()?.n ?? 0;
  const usedCharacters = db.select({ n: count() }).from(characters).where(inArray(characters.srdMonsterSlug, slugs)).get()?.n ?? 0;
  return { encounters: usedEncounters, characters: usedCharacters };
}

/**
 * Toglie un manuale e i suoi mostri. Gli scontri restano giocabili: `encounter_monsters` conserva
 * già nome, PF, CA e PE di ogni mostro (SPEC-0006). Le licenze che nessuno usa più se ne vanno.
 */
export function removeDocument(db: SourcesDb, key: string): void {
  db.transaction((tx) => {
    tx.delete(open5eDocuments).where(eq(open5eDocuments.key, key)).run();
    const used = new Set(tx.select({ licenses: open5eDocuments.licenses }).from(open5eDocuments).all().flatMap((d) => d.licenses as string[]));
    const all = tx.select({ key: open5eLicenses.key }).from(open5eLicenses).all();
    const orphans = all.map((l) => l.key).filter((k) => !used.has(k));
    if (orphans.length) tx.delete(open5eLicenses).where(inArray(open5eLicenses.key, orphans)).run();
  });
}

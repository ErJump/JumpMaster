import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { srdMonsters } from '@/db/schema';
import type { SrdMonsterData } from '@/lib/srd-types';

export interface MonsterListItem {
  slug: string;
  name: string;
  size: string;
  type: string;
  cr: number;
  crLabel: string;
  alignment: string;
}

/**
 * Solo i metadati, non i payload completi: l'elenco viene filtrato **lato client**
 * per rispondere all'istante (SPEC-0003 AC18), e 334 righe così pesano una ventina di kilobyte.
 * Lo stat block completo lo carica la pagina di dettaglio.
 */
export function listMonsters(): MonsterListItem[] {
  return db
    .select({
      slug: srdMonsters.slug,
      name: srdMonsters.name,
      size: srdMonsters.size,
      type: srdMonsters.type,
      cr: srdMonsters.cr,
      crLabel: srdMonsters.crLabel,
      alignment: srdMonsters.alignment,
    })
    .from(srdMonsters)
    .orderBy(asc(srdMonsters.name))
    .all();
}

export function getMonster(slug: string): { name: string; crLabel: string; xp: number; data: SrdMonsterData } | undefined {
  const row = db
    .select({ name: srdMonsters.name, crLabel: srdMonsters.crLabel, xp: srdMonsters.xp, data: srdMonsters.data })
    .from(srdMonsters)
    .where(eq(srdMonsters.slug, slug))
    .get();

  return row ? { ...row, data: row.data as SrdMonsterData } : undefined;
}

/** Valori distinti per i menu dei filtri, ricavati dai dati e non scritti a mano. */
export function monsterFacets(): { types: string[]; sizes: string[]; crs: Array<{ cr: number; label: string }> } {
  const rows = db
    .select({ type: srdMonsters.type, size: srdMonsters.size, cr: srdMonsters.cr, crLabel: srdMonsters.crLabel })
    .from(srdMonsters)
    .all();

  const types = [...new Set(rows.map((row) => row.type))].sort();

  // Le taglie hanno un ordine naturale che l'alfabeto non rispetta.
  const SIZE_ORDER = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
  const sizes = [...new Set(rows.map((row) => row.size))].sort(
    (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
  );

  const crMap = new Map<number, string>();
  for (const row of rows) crMap.set(row.cr, row.crLabel);
  const crs = [...crMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([cr, label]) => ({ cr, label }));

  return { types, sizes, crs };
}

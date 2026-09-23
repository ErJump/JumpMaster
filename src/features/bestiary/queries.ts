import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { monsters } from '@/db/schema';
import { monsterSources, monsterSourceOptions } from '@/db/queries/monsters';
import type { MonsterSource, SrdMonsterData } from '@/lib/srd-types';

export interface MonsterListItem {
  slug: string;
  name: string;
  size: string;
  type: string;
  cr: number;
  crLabel: string;
  alignment: string;
  /** `srd` oppure la chiave del manuale Open5e. */
  source: string;
}

/**
 * Tutti i mostri, dall'SRD e dai manuali Open5e scaricati (ADR-0013).
 *
 * Solo i metadati, non i payload completi: l'elenco viene filtrato **lato client**
 * per rispondere all'istante (SPEC-0003 AC18), e anche con qualche manuale Open5e scaricato l'elenco pesa poche centinaia di kilobyte.
 * Lo stat block completo lo carica la pagina di dettaglio.
 */
export function listMonsters(): MonsterListItem[] {
  return db
    .select({
      slug: monsters.slug,
      name: monsters.name,
      size: monsters.size,
      type: monsters.type,
      cr: monsters.cr,
      crLabel: monsters.crLabel,
      alignment: monsters.alignment,
      source: monsters.source,
    })
    .from(monsters)
    .orderBy(asc(monsters.name))
    .all();
}

export function getMonster(
  slug: string,
): { name: string; crLabel: string; xp: number; data: SrdMonsterData; source: MonsterSource | undefined } | undefined {
  const row = db
    .select({ name: monsters.name, crLabel: monsters.crLabel, xp: monsters.xp, data: monsters.data })
    .from(monsters)
    .where(eq(monsters.slug, slug))
    .get();

  return row ? { ...row, data: row.data as SrdMonsterData, source: monsterSources([slug])[slug] } : undefined;
}

/** Valori distinti per i menu dei filtri, ricavati dai dati e non scritti a mano. */
export function monsterFacets(): {
  types: string[];
  sizes: string[];
  crs: Array<{ cr: number; label: string }>;
  sources: Array<{ value: string; label: string }>;
} {
  const rows = db
    .select({ type: monsters.type, size: monsters.size, cr: monsters.cr, crLabel: monsters.crLabel })
    .from(monsters)
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

  return { types, sizes, crs, sources: monsterSourceOptions() };
}

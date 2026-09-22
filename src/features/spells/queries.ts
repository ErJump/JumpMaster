import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { srdSpells } from '@/db/schema';
import type { SrdSpellData } from '@/lib/srd-types';

export interface SpellListItem {
  slug: string;
  name: string;
  level: number;
  levelLabel: string;
  school: string;
  classes: string;
  concentration: boolean;
  ritual: boolean;
}

export function listSpells(): SpellListItem[] {
  return db
    .select({
      slug: srdSpells.slug,
      name: srdSpells.name,
      level: srdSpells.level,
      levelLabel: srdSpells.levelLabel,
      school: srdSpells.school,
      classes: srdSpells.classes,
      concentration: srdSpells.concentration,
      ritual: srdSpells.ritual,
    })
    .from(srdSpells)
    .orderBy(asc(srdSpells.name))
    .all();
}

export function getSpell(slug: string) {
  const row = db.select().from(srdSpells).where(eq(srdSpells.slug, slug)).get();
  return row ? { ...row, data: row.data as SrdSpellData } : undefined;
}

export function spellFacets(): { levels: Array<{ value: string; label: string }>; schools: string[]; classes: string[] } {
  const rows = db
    .select({ level: srdSpells.level, levelLabel: srdSpells.levelLabel, school: srdSpells.school, classes: srdSpells.classes })
    .from(srdSpells)
    .all();

  const levelMap = new Map<number, string>();
  for (const row of rows) levelMap.set(row.level, row.levelLabel);
  const levels = [...levelMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, label]) => ({ value: label, label }));

  const schools = [...new Set(rows.map((row) => row.school))].sort();

  // `classes` è una stringa con più nomi: va spacchettata per costruire il filtro.
  const classes = [
    ...new Set(rows.flatMap((row) => row.classes.split(',').map((name) => name.trim())).filter(Boolean)),
  ].sort();

  return { levels, schools, classes };
}

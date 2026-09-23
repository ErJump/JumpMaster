/**
 * Tutti i mostri, da qualunque fonte (ADR-0013): la vista unisce l'SRD e i manuali Open5e.
 *
 * Bestiario, scontri e combattimento leggono da qui e non sanno da dove viene un mostro.
 * `source` vale `'srd'` oppure la chiave del manuale Open5e (`tob2`, `ccdx`…).
 *
 * ⚠ Una colonna nuova in `srd_monsters` o `open5e_monsters` va aggiunta anche qui.
 */
import { sqliteView, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const monsters = sqliteView('monsters', {
  slug: text().notNull(),
  name: text().notNull(),
  size: text().notNull(),
  type: text().notNull(),
  subtype: text(),
  alignment: text().notNull(),
  cr: real().notNull(),
  crLabel: text().notNull(),
  xp: integer().notNull(),
  ac: integer().notNull(),
  acType: text(),
  hp: integer().notNull(),
  hitDice: text(),
  data: text({ mode: 'json' }).notNull(),
  source: text().notNull(),
}).as(
  sql`SELECT slug, name, size, type, subtype, alignment, cr, cr_label, xp, ac, ac_type, hp, hit_dice, data, 'srd' AS source FROM srd_monsters
      UNION ALL
      SELECT slug, name, size, type, subtype, alignment, cr, cr_label, xp, ac, ac_type, hp, hit_dice, data, document_key AS source FROM open5e_monsters`,
);

export type MonsterRow = typeof monsters.$inferSelect;

/**
 * Tabelle del contenuto SRD 5.1 — **sola lettura a runtime** (invariante I5).
 *
 * Si rigenerano interamente con `npm run srd:import`: mai mescolate con i dati dell'utente.
 *
 * Ogni tabella conserva il payload originale in `data` oltre alle colonne indicizzate.
 * Così ricerche e filtri restano veloci senza dover modellare a colonne ogni dettaglio di
 * uno stat block, e nessuna informazione dell'SRD va persa.
 */
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const srdMonsters = sqliteTable(
  'srd_monsters',
  {
    slug: text().primaryKey(),
    name: text().notNull(),
    size: text().notNull(),
    type: text().notNull(),
    subtype: text(),
    alignment: text().notNull(),
    /** I gradi di sfida frazionari valgono 0.125 / 0.25 / 0.5: serve un reale, non un intero. */
    cr: real().notNull(),
    /** Resa tipografica del GS: "⅛", "¼", "½", "10". Vedi SPEC-0003 AC6. */
    crLabel: text().notNull(),
    xp: integer().notNull(),
    ac: integer().notNull(),
    acType: text(),
    hp: integer().notNull(),
    hitDice: text(),
    data: text({ mode: 'json' }).notNull(),
  },
  (t) => [
    index('idx_monsters_name').on(t.name),
    index('idx_monsters_cr').on(t.cr),
    index('idx_monsters_type').on(t.type),
    index('idx_monsters_size').on(t.size),
  ],
);

export const srdSpells = sqliteTable(
  'srd_spells',
  {
    slug: text().primaryKey(),
    name: text().notNull(),
    level: integer().notNull(),
    /** "Trucchetto" invece di "Livello 0" (SPEC-0003 AC10). */
    levelLabel: text().notNull(),
    school: text().notNull(),
    castingTime: text().notNull(),
    range: text().notNull(),
    duration: text().notNull(),
    concentration: integer({ mode: 'boolean' }).notNull(),
    ritual: integer({ mode: 'boolean' }).notNull(),
    components: text().notNull(),
    /** Classi che possono lanciarlo, separate da virgola: basta per il filtro. */
    classes: text().notNull(),
    description: text().notNull(),
    data: text({ mode: 'json' }).notNull(),
  },
  (t) => [
    index('idx_spells_name').on(t.name),
    index('idx_spells_level').on(t.level),
    index('idx_spells_school').on(t.school),
  ],
);

export const srdMagicItems = sqliteTable(
  'srd_magic_items',
  {
    slug: text().primaryKey(),
    name: text().notNull(),
    category: text().notNull(),
    rarity: text().notNull(),
    /** Ordine di rarità (0 = comune … 5 = artefatto), per ordinare senza confronti di stringhe. */
    rarityRank: integer().notNull(),
    description: text().notNull(),
    data: text({ mode: 'json' }).notNull(),
  },
  (t) => [index('idx_magic_items_name').on(t.name), index('idx_magic_items_rarity').on(t.rarityRank)],
);

export const srdEquipment = sqliteTable(
  'srd_equipment',
  {
    slug: text().primaryKey(),
    name: text().notNull(),
    category: text().notNull(),
    subcategory: text(),
    costValue: integer(),
    costUnit: text(),
    weight: real(),
    damage: text(),
    properties: text(),
    data: text({ mode: 'json' }).notNull(),
  },
  (t) => [index('idx_equipment_name').on(t.name), index('idx_equipment_category').on(t.category)],
);

export const srdRuleSections = sqliteTable(
  'srd_rule_sections',
  {
    slug: text().primaryKey(),
    name: text().notNull(),
    /** Testo pieno: è ciò su cui cerca il DM quando chiede "si può fare?" (SPEC-0003 AC14). */
    description: text().notNull(),
  },
  (t) => [index('idx_rules_name').on(t.name)],
);

export const srdConditions = sqliteTable('srd_conditions', {
  slug: text().primaryKey(),
  name: text().notNull(),
  description: text().notNull(),
});

export const srdClasses = sqliteTable('srd_classes', {
  slug: text().primaryKey(),
  name: text().notNull(),
  hitDie: integer().notNull(),
  data: text({ mode: 'json' }).notNull(),
});

export const srdRaces = sqliteTable('srd_races', {
  slug: text().primaryKey(),
  name: text().notNull(),
  speed: integer().notNull(),
  size: text().notNull(),
  data: text({ mode: 'json' }).notNull(),
});

export const srdBackgrounds = sqliteTable('srd_backgrounds', {
  slug: text().primaryKey(),
  name: text().notNull(),
  data: text({ mode: 'json' }).notNull(),
});

export const srdFeatures = sqliteTable(
  'srd_features',
  {
    slug: text().primaryKey(),
    name: text().notNull(),
    className: text().notNull(),
    level: integer().notNull(),
    description: text().notNull(),
  },
  (t) => [index('idx_features_class').on(t.className)],
);

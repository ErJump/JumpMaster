/**
 * Mostri da fonti aperte, scaricati dal DM da Open5e (SPEC-0015, ADR-0013).
 *
 * Come le tabelle `srd_*`: **sola lettura a runtime**, scritte solo dal loro import (I5). Il
 * repository non contiene questi dati: vivono soltanto nel database di chi li ha scaricati.
 */
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/** Il testo integrale di ogni licenza viaggia con i dati: l'OGL 1.0a lo richiede. */
export const open5eLicenses = sqliteTable('open5e_licenses', {
  key: text().primaryKey(),
  name: text().notNull(),
  text: text().notNull(),
});

/** Un manuale scaricato: da qui viene la riga «Fonte» sotto ogni stat block. */
export const open5eDocuments = sqliteTable('open5e_documents', {
  key: text().primaryKey(),
  name: text().notNull(),
  publisher: text().notNull(),
  permalink: text(),
  /** Chiavi di `open5e_licenses`. */
  licenses: text({ mode: 'json' }).notNull().default(sql`'[]'`),
  monsterCount: integer().notNull().default(0),
  importedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** Stesse colonne di `srd_monsters`, più il manuale di provenienza. */
export const open5eMonsters = sqliteTable(
  'open5e_monsters',
  {
    slug: text().primaryKey(),
    documentKey: text()
      .notNull()
      .references(() => open5eDocuments.key, { onDelete: 'cascade' }),
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
    /** Già convertito nel formato SRD: lo stat block è uno solo. */
    data: text({ mode: 'json' }).notNull(),
  },
  (t) => [index('idx_open5e_monsters_document').on(t.documentKey), index('idx_open5e_monsters_name').on(t.name)],
);

export type Open5eDocument = typeof open5eDocuments.$inferSelect;

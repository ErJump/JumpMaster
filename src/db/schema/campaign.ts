/**
 * Tabelle di dominio: i dati dell'utente.
 *
 * Invariante I6 — ogni tabella di dominio porta `campaignId` con `ON DELETE CASCADE`.
 * Così l'isolamento fra campagne non richiede alcuna logica speciale, e creare una nuova
 * campagna significa soltanto un altro `campaignId`.
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const campaigns = sqliteTable('campaigns', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text().notNull().default(''),
  setting: text().notNull().default(''),
  /** Appunti privati del DM: non finiranno mai nella Vista Giocatori (M3). */
  dmNotes: text().notNull().default(''),
  /** Livello medio del gruppo: lo userà l'encounter builder in M2. */
  partyLevel: integer().notNull().default(1),
  sessionCount: integer().notNull().default(0),
  status: text({ enum: ['active', 'paused', 'completed'] })
    .notNull()
    .default('active'),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Preferenze dell'app, chiave/valore. Contiene fra l'altro `activeCampaignId`.
 *
 * Perché nel database e non in localStorage: la Vista Giocatori (M3) è una **seconda finestra**.
 * Se la campagna attiva vivesse nel browser, le due finestre potrebbero divergere. Nel database
 * è una sola verità per tutto il processo. Vedi SPEC-0002 design.
 */
export const appSettings = sqliteTable('app_settings', {
  key: text().primaryKey(),
  value: text().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

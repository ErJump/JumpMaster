/**
 * Tabelle di dominio di M2 — i dati dell'utente.
 *
 * Invariante I6: ogni tabella porta `campaignId` con `ON DELETE CASCADE`, così l'isolamento
 * fra campagne non richiede logica speciale ed eliminare una campagna porta via tutto ciò
 * che le appartiene.
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { campaigns } from './campaign';

const campaignId = () =>
  integer()
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' });

const now = () =>
  integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`);

/* ── Personaggi (SPEC-0005) ───────────────────────────────────────── */

export const characters = sqliteTable(
  'characters',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    campaignId: campaignId(),
    kind: text({ enum: ['pc', 'npc'] }).notNull(),
    name: text().notNull(),

    // Personaggi giocanti
    playerName: text().notNull().default(''),
    className: text().notNull().default(''),
    subclass: text().notNull().default(''),
    race: text().notNull().default(''),
    level: integer().notNull().default(1),
    ac: integer().notNull().default(10),
    maxHp: integer().notNull().default(1),
    speed: integer().notNull().default(30),
    str: integer().notNull().default(10),
    dex: integer().notNull().default(10),
    con: integer().notNull().default(10),
    int: integer().notNull().default(10),
    wis: integer().notNull().default(10),
    cha: integer().notNull().default(10),
    /** Caratteristiche con competenza nei tiri salvezza, es. `["dex","wis"]`. */
    saveProficiencies: text({ mode: 'json' }).notNull().default(sql`'[]'`),
    skillProficiencies: text({ mode: 'json' }).notNull().default(sql`'[]'`),
    /** Abilità con esperienza: la competenza vi conta doppio. */
    skillExpertise: text({ mode: 'json' }).notNull().default(sql`'[]'`),

    // Personaggi non giocanti
    role: text().notNull().default(''),
    location: text().notNull().default(''),
    disposition: text({ enum: ['friendly', 'neutral', 'hostile', 'unknown'] })
      .notNull()
      .default('unknown'),
    appearance: text().notNull().default(''),
    voice: text().notNull().default(''),
    /** ⚠️ Riservato al DM: non finirà mai nella Vista Giocatori (M3). */
    secret: text().notNull().default(''),
    /** Stat block dal bestiario, se il PNG dovesse combattere. */
    srdMonsterSlug: text(),

    notes: text().notNull().default(''),
    archived: integer({ mode: 'boolean' }).notNull().default(false),
    createdAt: now(),
    updatedAt: now(),
  },
  (t) => [index('idx_characters_campaign').on(t.campaignId, t.kind)],
);

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;

/* ── Scontri (SPEC-0006) ──────────────────────────────────────────── */

export const encounters = sqliteTable(
  'encounters',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    campaignId: campaignId(),
    name: text().notNull(),
    description: text().notNull().default(''),
    notes: text().notNull().default(''),
    status: text({ enum: ['planned', 'running', 'done'] })
      .notNull()
      .default('planned'),
    createdAt: now(),
    updatedAt: now(),
  },
  (t) => [index('idx_encounters_campaign').on(t.campaignId)],
);

export const encounterMonsters = sqliteTable(
  'encounter_monsters',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    encounterId: integer()
      .notNull()
      .references(() => encounters.id, { onDelete: 'cascade' }),
    srdMonsterSlug: text().notNull(),
    count: integer().notNull().default(1),
    /**
     * Copie del momento in cui il mostro è stato aggiunto. Se un giorno reimportiamo l'SRD e
     * un mostro cambia, lo scontro salvato resta quello che il DM aveva preparato.
     */
    name: text().notNull(),
    cr: text().notNull(),
    xp: integer().notNull(),
    hp: integer().notNull().default(1),
    ac: integer().notNull().default(10),
    initiativeMod: integer().notNull().default(0),
    hitDice: text(),
  },
  (t) => [index('idx_encounter_monsters_encounter').on(t.encounterId)],
);

export type Encounter = typeof encounters.$inferSelect;
export type EncounterMonster = typeof encounterMonsters.$inferSelect;

/* ── Combattimento (SPEC-0007) ────────────────────────────────────── */

/**
 * Registro degli eventi del combattimento, **in sola aggiunta** (ADR-0005).
 *
 * L'annulla non cancella la riga: segna `undoneAt`. Così il registro resta intatto, l'annulla
 * è reversibile, e in M4 il registro completo diventerà il riassunto automatico della sessione.
 */
export const combatEvents = sqliteTable(
  'combat_events',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    encounterId: integer()
      .notNull()
      .references(() => encounters.id, { onDelete: 'cascade' }),
    /** Progressivo per scontro: definisce l'ordine di riduzione. */
    seq: integer().notNull(),
    type: text().notNull(),
    payload: text({ mode: 'json' }).notNull(),
    /** `null` = evento attivo. Valorizzato = annullato, quindi ignorato dalla riduzione. */
    undoneAt: integer({ mode: 'timestamp' }),
    createdAt: now(),
  },
  (t) => [index('idx_combat_events_encounter').on(t.encounterId, t.seq)],
);

export type CombatEventRow = typeof combatEvents.$inferSelect;

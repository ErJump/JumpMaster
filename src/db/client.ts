/**
 * Connessione al database locale.
 *
 * ⚠ Invariante I4 — `better-sqlite3` è un modulo nativo: questo file non deve MAI essere
 * importato da un Client Component. Solo Server Components, Server Actions e script.
 */
import 'server-only';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolve } from 'node:path';
import * as schema from './schema';

const DB_PATH = process.env.JUMPMASTER_DB ?? resolve(process.cwd(), 'data/jumpmaster.db');

// In sviluppo Next ricarica i moduli a ogni modifica: senza cache globale apriremmo
// una connessione nuova a ogni hot reload finché SQLite non protesta.
const globalForDb = globalThis as unknown as { __jumpmasterDb?: Database.Database };

const sqlite = globalForDb.__jumpmasterDb ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== 'production') globalForDb.__jumpmasterDb = sqlite;

// WAL: letture e scritture concorrenti senza bloccarsi. Serve perché la Vista Giocatori (M3)
// leggerà dallo stesso file mentre il pannello DM scrive.
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema, casing: 'snake_case' });
export { sqlite };

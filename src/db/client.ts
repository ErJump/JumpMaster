/**
 * Connessione al database locale.
 *
 * ⚠ Invariante I4 — `better-sqlite3` è un modulo nativo: questo file non deve MAI essere
 * importato da un Client Component. Solo Server Components, Server Actions e script.
 */
import 'server-only';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema';

const DB_PATH = process.env.JUMPMASTER_DB ?? resolve(process.cwd(), 'data/jumpmaster.db');

// In sviluppo Next ricarica i moduli a ogni modifica: senza cache globale apriremmo
// una connessione nuova a ogni hot reload finché SQLite non protesta.
const globalForDb = globalThis as unknown as { __jumpmasterDb?: Database.Database };

function openDatabase(): Database.Database {
  // `data/` è in .gitignore: su una copia appena clonata non esiste, e `new Database()`
  // fallirebbe con un messaggio oscuro ("directory does not exist"). Meglio crearla.
  mkdirSync(dirname(DB_PATH), { recursive: true });

  const connection = new Database(DB_PATH);
  // WAL: letture e scritture concorrenti senza bloccarsi. Serve perché la Vista Giocatori (M3)
  // leggerà dallo stesso file mentre il pannello DM scrive.
  connection.pragma('journal_mode = WAL');
  connection.pragma('foreign_keys = ON');

  // Le migrazioni si applicano da sole all'avvio.
  //
  // È una scelta deliberata per un'app locale a utente singolo: l'utente è un Dungeon Master,
  // non uno sviluppatore, e non deve ritrovarsi davanti a un "no such table" perché ha
  // dimenticato un comando. `migrate()` è idempotente e tiene traccia di cosa ha già applicato,
  // quindi rilanciarlo a ogni avvio non costa nulla.
  const migrationsFolder = resolve(process.cwd(), 'src/db/migrations');
  if (existsSync(migrationsFolder)) {
    migrate(drizzle(connection, { casing: 'snake_case' }), { migrationsFolder });
  }

  return connection;
}

const sqlite = globalForDb.__jumpmasterDb ?? openDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.__jumpmasterDb = sqlite;

export const db = drizzle(sqlite, { schema, casing: 'snake_case' });
export { sqlite };

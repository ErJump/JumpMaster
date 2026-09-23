/**
 * Connessione al database locale.
 *
 * ⚠ Invariante I4 — `better-sqlite3` è un modulo nativo: questo file non deve MAI essere
 * importato da un Client Component. Solo Server Components, Server Actions e route.
 */
import 'server-only';
import type Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { openDatabase } from './open';
import * as schema from './schema';

// In sviluppo Next ricarica i moduli a ogni modifica: senza cache globale apriremmo
// una connessione nuova a ogni hot reload finché SQLite non protesta.
const globalForDb = globalThis as unknown as { __jumpmasterDb?: Database.Database };

// Le migrazioni si applicano da sole all'apertura, in modo sicuro anche fra più processi
// (ADR-0010): l'utente è un Dungeon Master, non deve incontrare un «no such table».
const sqlite = globalForDb.__jumpmasterDb ?? openDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.__jumpmasterDb = sqlite;

export const db = drizzle(sqlite, { schema, casing: 'snake_case' });
export { sqlite };

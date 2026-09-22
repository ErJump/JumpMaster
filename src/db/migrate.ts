/**
 * Applica le migrazioni al database locale. Eseguito da `npm run db:migrate`.
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = process.env.JUMPMASTER_DB ?? resolve(process.cwd(), 'data/jumpmaster.db');
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

migrate(drizzle(sqlite, { casing: 'snake_case' }), {
  migrationsFolder: resolve(process.cwd(), 'src/db/migrations'),
});

sqlite.close();
console.log(`✓ Migrazioni applicate → ${dbPath}`);

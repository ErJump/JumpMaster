/**
 * Importa i JSON SRD nelle tabelle `srd_*`. Eseguito da `npm run srd:import`.
 *
 * Strategia: DELETE della tabella + INSERT, tutto in una transazione.
 * Sono tabelle in sola lettura e rigenerabili (invariante I5), quindi è più semplice
 * e più sicuro di un upsert riga per riga — e rende l'import **idempotente per
 * costruzione** (SPEC-0003 AC3).
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SRD_DATASETS, SRD_DATA_DIR } from './datasets';
import * as schema from '@/db/schema';
import {
  normalizeMonster,
  normalizeSpell,
  normalizeMagicItem,
  normalizeEquipment,
  normalizeRuleSection,
  normalizeCondition,
  normalizeFeature,
  normalizeClass,
  normalizeRace,
  normalizeBackground,
} from './normalize';

type RawEntry = Record<string, unknown>;

function readDataset(file: string): RawEntry[] {
  const path = resolve(process.cwd(), SRD_DATA_DIR, `${file}.json`);

  if (!existsSync(path)) {
    throw new Error(
      `Manca il file ${file}.json.\n` +
        `  I dati SRD non sono ancora stati scaricati: esegui prima  npm run srd:fetch`,
    );
  }

  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`${file}.json non contiene un array.`);
  }
  return parsed as RawEntry[];
}

function main(): void {
  // Un errore chiaro e anticipato è meglio di dieci errori oscuri a metà import.
  const missing = SRD_DATASETS.filter(
    (dataset) => !existsSync(resolve(process.cwd(), SRD_DATA_DIR, `${dataset.file}.json`)),
  );
  if (missing.length === SRD_DATASETS.length) {
    throw new Error(
      `Nessun dato SRD trovato in ${SRD_DATA_DIR}/.\n` + `  Esegui prima:  npm run srd:fetch`,
    );
  }

  const dbPath = process.env.JUMPMASTER_DB ?? resolve(process.cwd(), 'data/jumpmaster.db');
  if (!existsSync(dbPath)) {
    throw new Error(`Database non trovato in ${dbPath}.\n  Esegui prima:  npm run db:migrate`);
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema, casing: 'snake_case' });

  console.log('\n  📚 Importo l’SRD 5.1 nel database\n');

  const counts: Array<{ label: string; imported: number; expected: number }> = [];

  // Un'unica transazione: se qualcosa va storto il database resta come prima,
  // invece di ritrovarsi con metà bestiario.
  sqlite.transaction(() => {
    const load = <T>(file: string, normalize: (raw: RawEntry) => T): T[] =>
      readDataset(file).map(normalize);

    const jobs = [
      { label: 'Mostri', table: schema.srdMonsters, rows: load('5e-SRD-Monsters', normalizeMonster) },
      { label: 'Incantesimi', table: schema.srdSpells, rows: load('5e-SRD-Spells', normalizeSpell) },
      { label: 'Oggetti magici', table: schema.srdMagicItems, rows: load('5e-SRD-Magic-Items', normalizeMagicItem) },
      { label: 'Equipaggiamento', table: schema.srdEquipment, rows: load('5e-SRD-Equipment', normalizeEquipment) },
      { label: 'Sezioni di regole', table: schema.srdRuleSections, rows: load('5e-SRD-Rule-Sections', normalizeRuleSection) },
      { label: 'Condizioni', table: schema.srdConditions, rows: load('5e-SRD-Conditions', normalizeCondition) },
      { label: 'Privilegi di classe', table: schema.srdFeatures, rows: load('5e-SRD-Features', normalizeFeature) },
      { label: 'Classi', table: schema.srdClasses, rows: load('5e-SRD-Classes', normalizeClass) },
      { label: 'Razze', table: schema.srdRaces, rows: load('5e-SRD-Races', normalizeRace) },
      { label: 'Background', table: schema.srdBackgrounds, rows: load('5e-SRD-Backgrounds', normalizeBackground) },
    ];

    for (const job of jobs) {
      db.delete(job.table).run();

      // SQLite ha un limite sul numero di variabili per statement: inseriamo a blocchi.
      const CHUNK = 100;
      for (let i = 0; i < job.rows.length; i += CHUNK) {
        const chunk = job.rows.slice(i, i + CHUNK);
        if (chunk.length > 0) db.insert(job.table).values(chunk as never).run();
      }

      const expected = SRD_DATASETS.find((d) => d.label === job.label)?.expected ?? 0;
      counts.push({ label: job.label, imported: job.rows.length, expected });
    }
  })();

  let drifted = 0;
  for (const { label, imported, expected } of counts) {
    const ok = imported === expected;
    if (!ok) drifted++;
    console.log(
      `  ${ok ? '✓' : '⚠'} ${label.padEnd(22)} ${String(imported).padStart(4)}` +
        (ok ? '' : `  (attesi ${expected})`),
    );
  }

  const total = counts.reduce((sum, entry) => sum + entry.imported, 0);
  console.log(`\n  ${total} voci importate in ${dbPath}`);
  if (drifted > 0) {
    console.log(
      `  ⚠ ${drifted} dataset con conteggi diversi dal previsto: il dataset a monte è vivo,\n` +
        `    controlla e aggiorna gli "expected" in src/content/srd/datasets.ts se è corretto.`,
    );
  }
  console.log();

  sqlite.close();
}

try {
  main();
} catch (error: unknown) {
  console.error(`\n  ✗ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

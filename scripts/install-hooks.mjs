#!/usr/bin/env node
/**
 * Collega i git hook versionati in .githooks/ (eseguito da `npm install` tramite lo script `prepare`).
 *
 * Usiamo core.hooksPath invece di copiare file in .git/hooks/ così gli hook restano versionati,
 * visibili in review e aggiornabili per tutti con un semplice pull.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// In CI, o quando il pacchetto viene installato come dipendenza, non c'è nulla da collegare.
if (!existsSync(resolve(ROOT, '.git')) || process.env.CI) {
  process.exit(0);
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: ROOT, stdio: 'ignore' });
  console.log('⚔  git hook collegati (.githooks) — `npm run guard` girerà a ogni commit.');
} catch {
  console.warn('⚠  Non sono riuscito a collegare i git hook. Esegui: git config core.hooksPath .githooks');
}

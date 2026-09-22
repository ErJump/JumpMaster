#!/usr/bin/env node
/**
 * guard.mjs — rende eseguibili le regole di AGENTS.md.
 *
 * Un AGENTS.md che *dice* "aggiorna il memory bank" viene ignorato al terzo commit di fretta.
 * Questo script fa fallire commit e CI. Le regole sono documentate in AGENTS.md §2.
 *
 *   node scripts/guard.mjs            regole strutturali (R1, R3, R4, R5)
 *   node scripts/guard.mjs --staged   + regola sul changeset (R2), usata dall'hook pre-commit
 *   node scripts/guard.mjs --ci       + regola sul changeset rispetto alla base, usata in CI
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const MODE = args.has('--staged') ? 'staged' : args.has('--ci') ? 'ci' : 'structural';

/* ─────────────────────────── output ─────────────────────────── */

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => c(1, s);
const dim = (s) => c(2, s);
const red = (s) => c(31, s);
const green = (s) => c(32, s);
const yellow = (s) => c(33, s);

const failures = [];
const notes = [];

/** Registra una violazione: cosa è rotto, e soprattutto come si sistema. */
function fail(rule, message, fix) {
  failures.push({ rule, message, fix });
}

/* ─────────────────────────── helpers ─────────────────────────── */

const p = (...parts) => join(ROOT, ...parts);

function readJson(relPath) {
  try {
    return JSON.parse(readFileSync(p(relPath), 'utf8'));
  } catch (err) {
    return { __error: err.message };
  }
}

function dirsIn(relPath) {
  const abs = p(relPath);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).filter((name) => {
    if (name.startsWith('.') || name.startsWith('_')) return false;
    return statSync(join(abs, name)).isDirectory();
  });
}

function git(...gitArgs) {
  try {
    return execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/** Front-matter YAML minimale: solo coppie `chiave: valore`, che è tutto ciò che ci serve. */
function parseFrontMatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!match) return null;
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    let value = kv[2].trim().replace(/^["']|["']$/g, '');
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    out[kv[1]] = value;
  }
  return out;
}

/** Elenco dei file toccati dal changeset in esame, o null se non determinabile. */
function changedFiles() {
  if (MODE === 'staged') {
    const out = git('diff', '--cached', '--name-only');
    return out === null ? null : out.split('\n').filter(Boolean);
  }
  if (MODE === 'ci') {
    const base = process.env.GUARD_BASE_REF || 'origin/main';
    const mergeBase = git('merge-base', 'HEAD', base);
    // Primo commit su un repo nuovo, o base non disponibile: niente changeset da valutare.
    if (!mergeBase) return null;
    const out = git('diff', '--name-only', `${mergeBase}..HEAD`);
    return out === null ? null : out.split('\n').filter(Boolean);
  }
  return null;
}

/* ─────────────────────────── R0 · memory bank ─────────────────────────── */

const MEMORY_FILES = [
  'project-brief.md',
  'product-context.md',
  'architecture.md',
  'tech-context.md',
  'active-context.md',
  'progress.md',
  'glossary-dnd.md',
];

function checkMemoryBank() {
  for (const file of MEMORY_FILES) {
    if (!existsSync(p('docs/memory', file))) {
      fail(
        'R0',
        `Manca il file del memory bank: docs/memory/${file}`,
        `Crealo. Il memory bank è ciò che permette alla prossima sessione di capire dove eravamo rimasti.`,
      );
    }
  }
  if (!existsSync(p('AGENTS.md'))) {
    fail('R0', 'Manca AGENTS.md', 'È il contratto operativo del repo: non può mancare.');
  }
}

/* ─────────────────────────── R1 · ogni feature ha una spec ─────────────────────────── */

function checkFeaturesHaveSpecs(index) {
  const features = dirsIn('src/features');
  const covered = new Set();
  for (const spec of index.specs ?? []) {
    for (const f of spec.features ?? []) covered.add(f);
  }

  for (const feature of features) {
    if (!covered.has(feature)) {
      fail(
        'R1',
        `La feature "src/features/${feature}/" non ha una spec registrata in docs/specs/index.json`,
        `Crea docs/specs/SPEC-NNNN-<slug>/spec.md e aggiungi "${feature}" al campo "features" della sua voce in index.json.`,
      );
    }
  }

  // Al contrario: una spec che dichiara feature inesistenti è un registro che mente.
  for (const spec of index.specs ?? []) {
    for (const f of spec.features ?? []) {
      if (!features.includes(f) && spec.status === 'done') {
        fail(
          'R1',
          `La spec ${spec.id} è "done" ma dichiara la feature "${f}", che non esiste in src/features/`,
          `O implementi la feature, o correggi il campo "features" di ${spec.id}, o riporti la spec a "in-progress".`,
        );
      }
    }
  }

  return features;
}

/* ─────────────────────────── R2 · memory bank aggiornato nel changeset ─────────────────────────── */

function checkMemoryUpdated(files) {
  if (files === null) {
    notes.push(
      MODE === 'structural'
        ? 'R2 non valutata: nessun changeset in esame (usa --staged o --ci).'
        : 'R2 non valutata: impossibile determinare il changeset (repo senza base di confronto).',
    );
    return;
  }

  const touchesSrc = files.some((f) => f.startsWith('src/'));
  if (!touchesSrc) return;

  const required = ['docs/memory/active-context.md', 'docs/memory/progress.md'];
  const missing = required.filter((r) => !files.includes(r));

  if (missing.length > 0) {
    fail(
      'R2',
      `Il changeset tocca src/ ma non aggiorna: ${missing.join(', ')}`,
      `Aggiorna quei file e includili NELLO STESSO commit. Non è burocrazia: è come la prossima sessione capisce a che punto eravamo.`,
    );
  }
}

/* ─────────────────────────── R3 · spec valide ─────────────────────────── */

const VALID_STATUS = new Set(['draft', 'in-progress', 'done', 'superseded']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function checkSpecs(index, features) {
  const specDirs = dirsIn('docs/specs');
  const indexed = new Map((index.specs ?? []).map((s) => [s.dir, s]));

  for (const dir of specDirs) {
    const specPath = p('docs/specs', dir, 'spec.md');
    if (!existsSync(specPath)) {
      fail('R3', `docs/specs/${dir}/ non contiene spec.md`, 'Ogni cartella di spec deve avere almeno spec.md.');
      continue;
    }

    const fm = parseFrontMatter(readFileSync(specPath, 'utf8'));
    if (!fm) {
      fail(
        'R3',
        `docs/specs/${dir}/spec.md non ha front-matter`,
        'Aggiungi in cima un blocco --- con almeno: id, status, updated.',
      );
      continue;
    }

    for (const key of ['id', 'status', 'updated']) {
      if (!fm[key]) fail('R3', `docs/specs/${dir}/spec.md: manca "${key}" nel front-matter`, 'Campi obbligatori: id, status, updated.');
    }
    if (fm.status && !VALID_STATUS.has(fm.status)) {
      fail(
        'R3',
        `docs/specs/${dir}/spec.md: status "${fm.status}" non valido`,
        `Valori ammessi: ${[...VALID_STATUS].join(', ')}.`,
      );
    }
    if (fm.updated && !ISO_DATE.test(fm.updated)) {
      fail('R3', `docs/specs/${dir}/spec.md: "updated" deve essere AAAA-MM-GG (trovato "${fm.updated}")`, 'Usa il formato ISO.');
    }

    if (!indexed.has(dir)) {
      fail(
        'R3',
        `La spec docs/specs/${dir}/ non è registrata in docs/specs/index.json`,
        `Aggiungi una voce con { "id": "${fm.id ?? 'SPEC-NNNN'}", "dir": "${dir}", ... }.`,
      );
      continue;
    }

    const entry = indexed.get(dir);
    if (entry.status !== fm.status) {
      fail(
        'R3',
        `Stato divergente per ${dir}: index.json dice "${entry.status}", spec.md dice "${fm.status}"`,
        'Allineali. Un registro che mente è peggio di nessun registro.',
      );
    }

    // Una spec ancora in bozza non può avere già codice in main (AGENTS.md §2.4).
    if (fm.status === 'draft') {
      for (const f of entry.features ?? []) {
        if (features.includes(f)) {
          fail(
            'R3',
            `La spec ${entry.id} è "draft" ma src/features/${f}/ esiste già`,
            'Prima decidi, poi scrivi: porta la spec a "in-progress" quando inizi a implementare.',
          );
        }
      }
    }
  }

  // Voci dell'indice che puntano a cartelle inesistenti.
  for (const [dir, entry] of indexed) {
    if (!specDirs.includes(dir)) {
      fail('R3', `index.json elenca "${dir}" (${entry.id}) ma la cartella non esiste`, 'Crea la cartella o rimuovi la voce.');
    }
  }
}

/* ─────────────────────────── R4 · ogni dipendenza ha un ADR ─────────────────────────── */

function checkDependenciesHaveAdr() {
  const pkg = readJson('package.json');
  if (pkg.__error) {
    fail('R4', `package.json illeggibile: ${pkg.__error}`, 'Correggi il JSON.');
    return;
  }

  const adrDir = p('docs/adr');
  if (!existsSync(adrDir)) {
    fail('R4', 'Manca docs/adr/', 'Ogni dipendenza va giustificata in un ADR.');
    return;
  }

  const adrText = readdirSync(adrDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readFileSync(join(adrDir, f), 'utf8'))
    .join('\n');

  const deps = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  const undocumented = deps.filter((d) => !adrText.includes(d));

  if (undocumented.length > 0) {
    fail(
      'R4',
      `Dipendenze senza ADR: ${undocumented.join(', ')}`,
      'Nomina ogni pacchetto in un ADR di docs/adr/. Le dipendenze sono debito a lungo termine: se non vale dieci righe, non vale l’installazione.',
    );
  }
}

/* ─────────────────────────── R5 · confini architetturali ─────────────────────────── */

/** Cammina un albero raccogliendo i file .ts/.tsx. */
function walkSource(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walkSource(abs, acc);
    else if (/\.tsx?$/.test(name)) acc.push(abs);
  }
  return acc;
}

const IMPORT_RE = /(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;

function importsOf(file) {
  const src = readFileSync(file, 'utf8');
  const found = [];
  for (const m of src.matchAll(IMPORT_RE)) found.push(m[1] ?? m[2]);
  return found;
}

function checkBoundaries(features) {
  // I1 — core/ resta puro: niente React, Next, Drizzle, DB o feature.
  const forbiddenInCore = ['react', 'react-dom', 'next', 'drizzle-orm', 'better-sqlite3', '@/db', '@/features', '@/ui', '@/app'];
  for (const file of walkSource(p('src/core'))) {
    for (const imp of importsOf(file)) {
      if (forbiddenInCore.some((f) => imp === f || imp.startsWith(`${f}/`))) {
        fail(
          'R5',
          `${file.replace(`${ROOT}/`, '')} importa "${imp}": src/core/ deve restare puro (invariante I1)`,
          'La logica in core/ non conosce React, Next né il database. Sposta la dipendenza nella feature che la usa.',
        );
      }
    }
  }

  // I2 — una feature non importa da un'altra feature.
  for (const feature of features) {
    for (const file of walkSource(p('src/features', feature))) {
      for (const imp of importsOf(file)) {
        const m = /^@\/features\/([^/]+)/.exec(imp);
        if (m && m[1] !== feature) {
          fail(
            'R5',
            `${file.replace(`${ROOT}/`, '')} importa da "@/features/${m[1]}" (invariante I2)`,
            'Le feature non si importano fra loro. Ciò che serve a entrambe sale in src/core/ o src/ui/.',
          );
        }
      }
    }
  }
}

/* ─────────────────────────── esecuzione ─────────────────────────── */

console.log(bold('\n  ⚔  JumpMaster · guard rail') + dim(`  (modo: ${MODE})\n`));

checkMemoryBank();

const index = readJson('docs/specs/index.json');
if (index.__error) {
  fail('R1', `docs/specs/index.json illeggibile: ${index.__error}`, 'È il registro spec ↔ feature: deve essere JSON valido.');
}

const features = index.__error ? [] : checkFeaturesHaveSpecs(index);
if (!index.__error) checkSpecs(index, features);
checkMemoryUpdated(changedFiles());
checkDependenciesHaveAdr();
checkBoundaries(features);

const RULE_NAMES = {
  R0: 'Memory bank presente',
  R1: 'Ogni feature ha una spec',
  R2: 'Memory bank aggiornato nel commit',
  R3: 'Spec valide e allineate al registro',
  R4: 'Ogni dipendenza ha un ADR',
  R5: 'Confini architetturali rispettati',
};

for (const note of notes) console.log(`  ${dim('·')} ${dim(note)}`);
if (notes.length > 0) console.log();

if (failures.length === 0) {
  const checked = Object.entries(RULE_NAMES)
    .filter(([id]) => id !== 'R2' || MODE !== 'structural')
    .map(([id, name]) => `  ${green('✓')} ${dim(id)}  ${name}`)
    .join('\n');
  console.log(`${checked}\n\n  ${green(bold('Guard rail superati.'))}\n`);
  process.exit(0);
}

const byRule = new Map();
for (const f of failures) {
  if (!byRule.has(f.rule)) byRule.set(f.rule, []);
  byRule.get(f.rule).push(f);
}

for (const [rule, items] of [...byRule].sort()) {
  console.log(`  ${red('✗')} ${bold(rule)}  ${RULE_NAMES[rule] ?? ''}`);
  for (const item of items) {
    console.log(`      ${item.message}`);
    console.log(`      ${yellow('→')} ${dim(item.fix)}\n`);
  }
}

console.log(
  `  ${red(bold(`${failures.length} violazione/i.`))} ${dim('Le regole sono documentate in AGENTS.md §2.')}\n`,
);
process.exit(1);

/**
 * Scarica i JSON dell'SRD in `src/content/srd/data/` (cartella ignorata da git).
 *
 * È l'**unico** punto del progetto che tocca la rete: l'app a runtime funziona offline
 * (AGENTS.md §5). Eseguito da `npm run srd:fetch`.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { SRD_BASE_URL, SRD_DATASETS, SRD_DATA_DIR } from './datasets';

async function main(): Promise<void> {
  const targetDir = resolve(process.cwd(), SRD_DATA_DIR);
  await mkdir(targetDir, { recursive: true });

  console.log(`\n  📥 Scarico i dati SRD 5.1 da 5e-bits/5e-database\n`);

  let total = 0;

  for (const dataset of SRD_DATASETS) {
    const url = `${SRD_BASE_URL}/${dataset.file}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Non sono riuscito a scaricare ${dataset.file}: HTTP ${response.status} da ${url}`);
    }

    const text = await response.text();

    // Se il JSON non è valido, meglio saperlo ora che a metà import.
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error(`${dataset.file}: mi aspettavo un array, ho ricevuto ${typeof parsed}.`);
    }

    await writeFile(join(targetDir, `${dataset.file}.json`), text, 'utf8');

    const drift = parsed.length === dataset.expected ? '' : ` ⚠ attesi ${dataset.expected}`;
    console.log(`  ✓ ${dataset.label.padEnd(22)} ${String(parsed.length).padStart(4)}${drift}`);
    total += parsed.length;
  }

  console.log(`\n  ${total} voci salvate in ${SRD_DATA_DIR}/`);
  console.log(`  Ora esegui: npm run srd:import\n`);
}

main().catch((error: unknown) => {
  console.error(`\n  ✗ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});

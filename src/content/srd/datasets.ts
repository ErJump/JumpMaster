/**
 * Registro dei dataset SRD 5.1 (regolamento 2014).
 *
 * Fonte: https://github.com/5e-bits/5e-database (MIT), cartella `src/2014/en/`.
 * Vedi docs/adr/ADR-0003.
 *
 * `expected` è il numero di voci che ci aspettiamo. L'import lo confronta e avvisa se cambia:
 * il dataset a monte è vivo, e un calo improvviso significherebbe un download troncato.
 */
export const SRD_BASE_URL = 'https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014/en';

export interface SrdDataset {
  /** Nome del file, senza `.json`. */
  file: string;
  /** Etichetta in italiano, per i messaggi dell'import. */
  label: string;
  expected: number;
}

export const SRD_DATASETS = [
  { file: '5e-SRD-Monsters', label: 'Mostri', expected: 334 },
  { file: '5e-SRD-Spells', label: 'Incantesimi', expected: 319 },
  { file: '5e-SRD-Magic-Items', label: 'Oggetti magici', expected: 362 },
  { file: '5e-SRD-Equipment', label: 'Equipaggiamento', expected: 237 },
  { file: '5e-SRD-Rule-Sections', label: 'Sezioni di regole', expected: 33 },
  { file: '5e-SRD-Conditions', label: 'Condizioni', expected: 15 },
  { file: '5e-SRD-Features', label: 'Privilegi di classe', expected: 407 },
  { file: '5e-SRD-Classes', label: 'Classi', expected: 12 },
  { file: '5e-SRD-Races', label: 'Razze', expected: 9 },
  { file: '5e-SRD-Backgrounds', label: 'Background', expected: 1 },
] as const satisfies readonly SrdDataset[];

export const SRD_DATA_DIR = 'src/content/srd/data';

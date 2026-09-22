/**
 * Stima della difficoltà di uno scontro.
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * ⚠️ **Questa non è una regola ufficiale di D&D.** Le tabelle di bilanciamento della Guida del DM
 * non sono nell'SRD e non esistono in alcuna fonte aperta, quindi la stima è nostra: costruita sui
 * punti esperienza dei mostri, che sono dato SRD. Le ragioni, per esteso, in ADR-0008.
 *
 * Tutte le soglie del sistema stanno **qui dentro**: se la taratura si rivelerà sbagliata al
 * tavolo, si corregge in un punto solo.
 */
import { crToXp } from './challenge';

export type Difficulty = 'banale' | 'facile' | 'impegnativo' | 'duro' | 'letale';

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; expect: string }> = {
  banale: {
    label: 'Banale',
    expect: 'Non li scalfirà. Va bene per far vedere quanto sono diventati forti.',
  },
  facile: {
    label: 'Facile',
    expect: 'Se la caveranno senza fatica. Qualche punto ferita, nulla di più.',
  },
  impegnativo: {
    label: 'Impegnativo',
    expect: 'Dovrebbero farcela, ma ci lasceranno risorse. È lo scontro tipico di una sessione.',
  },
  duro: {
    label: 'Duro',
    expect: 'Rischiano davvero. Qualcuno potrebbe cadere a 0 punti ferita.',
  },
  letale: {
    label: 'Letale',
    expect: 'Può uccidere un personaggio, o il gruppo intero se va male. Usalo di proposito.',
  },
};

/**
 * Quanto il numero dei mostri aumenta la minaccia, a parità di punti esperienza.
 *
 * Otto goblin sono più pericolosi di un solo mostro con gli stessi PE totali, perché agiscono
 * otto volte per round: è l'economia delle azioni.
 *
 * Usiamo una curva continua `n^0.35` invece di una tabella a scalini. Una tabella creerebbe salti
 * assurdi — passare da sei a sette mostri non può far scattare la difficoltà di un quarto — mentre
 * una curva cresce in modo regolare. In pratica: **ogni raddoppio del numero di mostri aumenta la
 * minaccia di circa il 27%**.
 */
export function actionEconomyFactor(monsterCount: number): number {
  if (monsterCount <= 1) return 1;
  return Math.round(monsterCount ** 0.35 * 100) / 100;
}

/**
 * Il metro di paragone: i punti esperienza di un mostro di grado di sfida pari al livello del
 * gruppo, scalati sulla dimensione reale del gruppo.
 *
 * L'ancoraggio è la definizione stessa di grado di sfida: un mostro di GS pari al livello è uno
 * scontro equo per quattro avventurieri.
 */
export function partyBenchmarkXp(partyLevel: number, partySize: number): number {
  const level = Math.min(20, Math.max(1, Math.round(partyLevel)));
  const soloXp = crToXp(level) ?? 0;
  return (soloXp * Math.max(1, partySize)) / 4;
}

/** Le soglie del sistema. Un solo posto da toccare per ritarare tutto. */
const BANDS: ReadonlyArray<readonly [max: number, difficulty: Difficulty]> = [
  [0.4, 'banale'],
  [0.8, 'facile'],
  [1.4, 'impegnativo'],
  [2.2, 'duro'],
  [Number.POSITIVE_INFINITY, 'letale'],
];

export function difficultyFromRatio(ratio: number): Difficulty {
  return BANDS.find(([max]) => ratio < max)?.[1] ?? 'letale';
}

export interface EncounterMonsterInput {
  /** Punti esperienza del singolo mostro (dato SRD). */
  xp: number;
  count: number;
}

export interface EncounterParty {
  level: number;
  size: number;
}

export interface EncounterEvaluation {
  monsterCount: number;
  totalXp: number;
  actionFactor: number;
  effectiveXp: number;
  benchmarkXp: number;
  ratio: number;
  difficulty: Difficulty | null;
  /** `false` quando la campagna non ha personaggi giocanti: senza gruppo non c'è paragone. */
  hasParty: boolean;
}

/**
 * Restituisce **tutti i passaggi**, non solo il verdetto.
 *
 * L'interfaccia li mostra per intero (SPEC-0006 AC2): un DM alle prime armi che non capisce da
 * dove esce un numero non impara a fidarsene, e l'app esiste anche per insegnargli il mestiere.
 */
export function evaluateEncounter(
  monsters: readonly EncounterMonsterInput[],
  party: EncounterParty,
): EncounterEvaluation {
  const monsterCount = monsters.reduce((sum, entry) => sum + Math.max(0, entry.count), 0);
  const totalXp = monsters.reduce((sum, entry) => sum + entry.xp * Math.max(0, entry.count), 0);

  const actionFactor = actionEconomyFactor(monsterCount);
  const effectiveXp = Math.round(totalXp * actionFactor);

  const hasParty = party.size > 0;
  const benchmarkXp = hasParty ? partyBenchmarkXp(party.level, party.size) : 0;

  // Senza gruppo, o senza mostri, non c'è nulla da confrontare: meglio nessun verdetto
  // che un verdetto inventato.
  if (!hasParty || benchmarkXp === 0 || monsterCount === 0) {
    return {
      monsterCount,
      totalXp,
      actionFactor,
      effectiveXp,
      benchmarkXp,
      ratio: 0,
      difficulty: null,
      hasParty,
    };
  }

  const ratio = effectiveXp / benchmarkXp;

  return {
    monsterCount,
    totalXp,
    actionFactor,
    effectiveXp,
    benchmarkXp,
    ratio: Math.round(ratio * 100) / 100,
    difficulty: difficultyFromRatio(ratio),
    hasParty,
  };
}

/**
 * Motore di lancio.
 *
 * Il generatore casuale è **iniettabile**: senza di esso testare "4d6kh3 scarta il più basso"
 * richiederebbe statistica invece di asserzioni, e SPEC-0004 AC11 sarebbe irrealizzabile.
 *
 * ⚠ Modulo puro (invariante I1).
 */
import { parseDice } from './parse';
import type { DiceExpression, RollResult, RolledDie, RolledTerm } from './types';

/** Generatore in [0, 1), come `Math.random`. */
export type Rng = () => number;

export function rollExpression(expression: DiceExpression, rng: Rng = Math.random): RollResult {
  const terms: RolledTerm[] = [];
  let running = 0;
  let natural20 = false;
  let natural1 = false;

  for (const [position, term] of expression.terms.entries()) {
    const signPrefix = term.sign === -1 ? '-' : position === 0 ? '' : '+';

    if (term.kind === 'constant') {
      const value = term.sign * term.value;
      running += value;
      terms.push({ notation: `${signPrefix}${term.value}`, sign: term.sign, dice: [], value });
      continue;
    }

    const rolled: RolledDie[] = Array.from({ length: term.count }, () => ({
      value: rollDie(term.faces, rng),
      faces: term.faces,
      kept: true,
    }));

    if (term.keep) applyKeep(rolled, term.keep.mode, term.keep.count);

    const subtotal = term.sign * rolled.reduce((sum, die) => (die.kept ? sum + die.value : sum), 0);
    running += subtotal;

    // Solo i dadi **tenuti** contano: un 20 scartato da un tiro con svantaggio non è un critico.
    for (const die of rolled) {
      if (!die.kept || die.faces !== 20) continue;
      if (die.value === 20) natural20 = true;
      if (die.value === 1) natural1 = true;
    }

    const keepSuffix = term.keep ? `${term.keep.mode}${term.keep.count}` : '';
    terms.push({
      notation: `${signPrefix}${term.count}d${term.faces}${keepSuffix}`,
      sign: term.sign,
      dice: rolled,
      value: subtotal,
    });
  }

  // La divisione è l'ultimo passo e arrotonda per difetto: è così che funziona
  // il danno dimezzato su un tiro salvezza riuscito (SRD 5.1, "Damage and Healing").
  const total = expression.divisor === 1 ? running : Math.floor(running / expression.divisor);

  return { expression, terms, total, natural20, natural1 };
}

function rollDie(faces: number, rng: Rng): number {
  return Math.floor(rng() * faces) + 1;
}

/**
 * Marca come scartati i dadi che la clausola tieni/scarta esclude.
 *
 * Ordina gli **indici** invece dei dadi, così l'ordine in cui sono usciti resta quello mostrato
 * al tavolo: il DM deve rivedere la sequenza reale, non una lista riordinata.
 */
function applyKeep(dice: RolledDie[], mode: 'kh' | 'kl' | 'dh' | 'dl', count: number): void {
  const byValue = dice
    .map((die, index) => ({ index, value: die.value }))
    .sort((a, b) => b.value - a.value || a.index - b.index);

  const discarded = new Set<number>();

  switch (mode) {
    case 'kh': // tieni i `count` più alti → scarta il resto
      byValue.slice(count).forEach((entry) => discarded.add(entry.index));
      break;
    case 'kl': // tieni i `count` più bassi
      byValue.slice(0, byValue.length - count).forEach((entry) => discarded.add(entry.index));
      break;
    case 'dh': // scarta i `count` più alti
      byValue.slice(0, count).forEach((entry) => discarded.add(entry.index));
      break;
    case 'dl': // scarta i `count` più bassi
      byValue.slice(byValue.length - count).forEach((entry) => discarded.add(entry.index));
      break;
  }

  for (const index of discarded) {
    const die = dice[index];
    if (die) die.kept = false;
  }
}

/** Scorciatoia: analizza e lancia in un colpo solo. */
export function roll(notation: string, rng?: Rng): RollResult {
  return rollExpression(parseDice(notation), rng);
}

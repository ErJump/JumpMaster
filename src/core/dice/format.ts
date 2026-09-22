/** Resa testuale di un lancio. ⚠ Modulo puro (invariante I1). */
import type { RollResult } from './types';

/**
 * Riepilogo leggibile, es. `2d20kh1+5 → [18, ~~7~~] +5 = 23`.
 * I dadi scartati restano visibili fra tilde: nasconderli toglierebbe al tavolo
 * la possibilità di verificare il tiro.
 */
export function formatRoll(result: RollResult): string {
  const body = result.terms
    .map((term) => {
      if (term.dice.length === 0) return term.notation;
      const dice = term.dice.map((die) => (die.kept ? String(die.value) : `~~${die.value}~~`)).join(', ');
      return `${term.notation} [${dice}]`;
    })
    .join(' ');

  const divisor = result.expression.divisor === 1 ? '' : ` / ${result.expression.divisor}`;
  return `${body}${divisor} = ${result.total}`;
}

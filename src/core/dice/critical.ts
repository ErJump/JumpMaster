/**
 * Danno da colpo critico — SRD 5.1, «Critical Hits».
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * Sul critico si tirano **due volte tutti i dadi del danno**, ma il modificatore si somma una
 * volta sola: `1d6+2` diventa `2d6+2`, non `2d6+4`. È l'errore classico — raddoppiare anche il
 * modificatore, o raddoppiare il totale — e un DM alle prime armi lo fa quasi sempre.
 */
import { parseDice } from './parse';

export function criticalDamage(notation: string): string {
  const expression = parseDice(notation);

  const body = expression.terms
    .map((term, position) => {
      const sign = term.sign === -1 ? '-' : position === 0 ? '' : '+';
      if (term.kind === 'constant') return `${sign}${term.value}`;
      // Un termine con tieni/scarta non è un dado di danno: lo lasciamo com'è.
      if (term.keep) return `${sign}${term.count}d${term.faces}${term.keep.mode}${term.keep.count}`;
      return `${sign}${term.count * 2}d${term.faces}`;
    })
    .join('');

  return expression.divisor === 1 ? body : `${body}/${expression.divisor}`;
}

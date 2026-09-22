/**
 * Riscrittura di un tiro per vantaggio e svantaggio (SPEC-0004 AC6).
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * In D&D vantaggio e svantaggio si applicano **al d20**, non all'intero tiro: `1d20+5`
 * con vantaggio diventa `2d20kh1+5`, e il modificatore resta dov'era. Tirare due volte
 * anche i dadi di danno sarebbe un errore di regole, non un dettaglio estetico.
 */

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

export const ADVANTAGE_LABELS: Record<AdvantageMode, string> = {
  normal: 'Normale',
  advantage: 'Vantaggio',
  disadvantage: 'Svantaggio',
};

// Il primo termine d20 del tiro: quello per colpire o la prova.
const LEADING_D20 = /^\s*(?:1)?d20(?![0-9])/i;

export function withAdvantage(notation: string, mode: AdvantageMode): string {
  if (mode === 'normal') return notation;
  if (!LEADING_D20.test(notation)) return notation;

  const keep = mode === 'advantage' ? '2d20kh1' : '2d20kl1';
  return notation.replace(LEADING_D20, keep);
}

/** Vero se il tiro può ricevere vantaggio: serve alla UI per disattivare i pulsanti. */
export function acceptsAdvantage(notation: string): boolean {
  return LEADING_D20.test(notation);
}

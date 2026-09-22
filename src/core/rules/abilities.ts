/**
 * Caratteristiche, modificatori e competenza.
 *
 * ⚠ Modulo puro (invariante I1): niente React, niente database.
 * È la SOLA fonte di verità per questi numeri. Il bestiario, il combat tracker e la scheda
 * del personaggio devono mostrare lo stesso valore, e l'unico modo per garantirlo è che lo
 * chiedano tutti qui.
 *
 * Riferimento: SRD 5.1, "Ability Scores and Modifiers", "Proficiency Bonus".
 */

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type Ability = (typeof ABILITIES)[number];

/** Nomi italiani e sigle, per l'interfaccia. Vedi docs/memory/glossary-dnd.md. */
export const ABILITY_LABELS: Record<Ability, { it: string; short: string; en: string }> = {
  str: { it: 'Forza', short: 'FOR', en: 'Strength' },
  dex: { it: 'Destrezza', short: 'DES', en: 'Dexterity' },
  con: { it: 'Costituzione', short: 'COS', en: 'Constitution' },
  int: { it: 'Intelligenza', short: 'INT', en: 'Intelligence' },
  wis: { it: 'Saggezza', short: 'SAG', en: 'Wisdom' },
  cha: { it: 'Carisma', short: 'CAR', en: 'Charisma' },
};

/**
 * Modificatore di caratteristica: `(punteggio − 10) / 2`, arrotondato per difetto.
 *
 * L'arrotondamento è verso il basso **anche per i negativi**: un punteggio di 1 dà −5, non −4.
 * `Math.floor(-4.5)` fa esattamente questo, mentre `Math.trunc` sbaglierebbe.
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Formatta un modificatore col segno, come sulle schede: `+3`, `−1`, `+0`. */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/** Bonus di competenza di un personaggio al livello dato (1–20). */
export function proficiencyBonus(level: number): number {
  const clamped = Math.min(20, Math.max(1, level));
  return 2 + Math.floor((clamped - 1) / 4);
}

/**
 * Bonus di competenza di un mostro, ricavato dal grado di sfida.
 *
 * I GS sotto 1 usano comunque +2, quindi la formula parte da GS 1.
 * SRD 5.1, tabella "Proficiency Bonus by Challenge Rating".
 */
export function proficiencyBonusForCr(cr: number): number {
  if (cr < 1) return 2;
  return 2 + Math.floor((Math.min(30, cr) - 1) / 4);
}

/**
 * Punteggio passivo: 10 + modificatore (+ competenza, se competente).
 * Usato soprattutto per la Percezione passiva, che il DM consulta di continuo.
 */
export function passiveScore(modifier: number, options: { proficient?: boolean; proficiencyBonus?: number } = {}): number {
  const bonus = options.proficient ? (options.proficiencyBonus ?? 0) : 0;
  return 10 + modifier + bonus;
}

/** Media di un tiro di dadi vita, es. `"18d10+36"` → 135. Serve per i PF medi di un mostro. */
export function averageRoll(diceExpression: string): number | null {
  const match = /^\s*(\d+)\s*d\s*(\d+)\s*([+-]\s*\d+)?\s*$/i.exec(diceExpression);
  if (!match) return null;

  const count = Number(match[1]);
  const faces = Number(match[2]);
  const modifier = match[3] ? Number(match[3].replace(/\s+/g, '')) : 0;

  return Math.floor((count * (faces + 1)) / 2) + modifier;
}

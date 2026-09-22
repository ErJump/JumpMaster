/** ⚠ Modulo puro (invariante I1): niente React, niente database. */

/** `kh` tieni i più alti · `kl` tieni i più bassi · `dh` scarta i più alti · `dl` scarta i più bassi. */
export type KeepMode = 'kh' | 'kl' | 'dh' | 'dl';

export interface DiceTerm {
  kind: 'dice';
  sign: 1 | -1;
  count: number;
  faces: number;
  keep: { mode: KeepMode; count: number } | null;
}

export interface ConstantTerm {
  kind: 'constant';
  sign: 1 | -1;
  value: number;
}

export type Term = DiceTerm | ConstantTerm;

export interface DiceExpression {
  /** Notazione normalizzata, es. `2d20kh1+5`. */
  notation: string;
  terms: Term[];
  /** Divisore finale, es. `8d6/2` per un tiro salvezza riuscito. 1 se assente. */
  divisor: number;
}

export interface RolledDie {
  value: number;
  faces: number;
  /** `false` per i dadi scartati: vanno mostrati **barrati**, non nascosti (SPEC-0004 AC3). */
  kept: boolean;
}

export interface RolledTerm {
  notation: string;
  sign: 1 | -1;
  dice: RolledDie[];
  /** Subtotale con segno già applicato. */
  value: number;
}

export interface RollResult {
  expression: DiceExpression;
  terms: RolledTerm[];
  total: number;
  /** Vero se un d20 **tenuto** mostra 20. */
  natural20: boolean;
  /** Vero se un d20 **tenuto** mostra 1. */
  natural1: boolean;
}

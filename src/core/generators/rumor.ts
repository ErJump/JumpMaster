/** Voci di paese — SPEC-0011. ⚠ Modulo puro (invariante I1). */
import { capitalize, pick, type Rng } from './random';
import { RUMOR_DETAILS, RUMOR_EVENTS, RUMOR_TREASURES, RUMOR_WHEN, RUMOR_WHERE, RUMOR_WHO } from './tables';

export type RumorTruth = 'vera' | 'falsa' | 'mezza verità';

export interface GeneratedRumor {
  text: string;
  /** ⚠️ Riservato al DM (AC10): i giocatori sentono la voce, non sanno se è vera. */
  truth: RumorTruth;
}

type Form = (typeof RUMOR_WHO)[number]['form'];

/** «sia stato visto», «sia stata vista», «siano stati visti», «siano state viste». */
const SEEN: Record<Form, string> = {
  ms: 'sia stato visto',
  fs: 'sia stata vista',
  mp: 'siano stati visti',
  fp: 'siano state viste',
};

/** «giura», «giurano». */
const SWEARS: Record<Form, string> = { ms: 'giura', fs: 'giura', mp: 'giurano', fp: 'giurano' };

/**
 * Modelli costruiti perché **ogni** combinazione sia grammaticale: niente «di» davanti a un
 * soggetto con articolo (verrebbe «di il»), niente congiuntivi davanti a frasi all'indicativo.
 */
const TEMPLATES: ReadonlyArray<(rng: Rng) => string> = [
  (rng) => {
    const who = pick(rng, RUMOR_WHO);
    return `Dicono che ${who.text} ${SEEN[who.form]} ${pick(rng, RUMOR_WHERE)} ${pick(rng, RUMOR_WHEN)}, ${pick(rng, RUMOR_DETAILS)}.`;
  },
  (rng) => `Chi va ${pick(rng, RUMOR_WHERE)} ${pick(rng, RUMOR_WHEN)} trova ${pick(rng, RUMOR_TREASURES)}.`,
  (rng) => `Da quando ${pick(rng, RUMOR_EVENTS)}, nessuno passa più ${pick(rng, RUMOR_WHERE)}.`,
  (rng) => {
    const who = pick(rng, RUMOR_WHO);
    return `${capitalize(who.text)} ${SWEARS[who.form]} di aver visto ${pick(rng, RUMOR_TREASURES)} ${pick(rng, RUMOR_WHERE)}.`;
  },
  (rng) => `Si dice in giro che ${pick(rng, RUMOR_EVENTS)}. E che c\u2019entra ${pick(rng, RUMOR_WHO).text}.`,
];

export function generateRumor(rng: Rng): GeneratedRumor {
  const text = pick(rng, TEMPLATES)(rng);
  const roll = rng();
  // Circa metà delle voci sono vere: abbastanza da doverle ascoltare, non abbastanza da fidarsi.
  const truth: RumorTruth = roll < 0.45 ? 'vera' : roll < 0.75 ? 'mezza verità' : 'falsa';
  return { text, truth };
}

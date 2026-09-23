/** Spunti narrativi — SPEC-0011. ⚠ Modulo puro (invariante I1). */
import { chance, pick, type Rng } from './random';
import { HOOK_GENERIC_TWISTS, HOOK_WHAT, HOOK_WHO, HOOK_WHY } from './tables';

export interface GeneratedHook {
  who: string;
  what: string;
  why: string;
  /** La complicazione: la scopriranno strada facendo. */
  twist: string;
  text: string;
}

export function generateHook(rng: Rng): GeneratedHook {
  const who = pick(rng, HOOK_WHO);
  const task = pick(rng, HOOK_WHAT);
  const why = pick(rng, HOOK_WHY);
  // Più spesso una complicazione legata all'incarico, a volte una che vale per tutti.
  const twist = chance(rng, 0.65) ? pick(rng, task.twists) : pick(rng, HOOK_GENERIC_TWISTS);
  return { who, what: task.text, why, twist, text: `${who} chiede al gruppo di ${task.text}, perché ${why}. Ma ${twist}.` };
}

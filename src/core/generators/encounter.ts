/**
 * Incontro casuale in una fascia di difficoltà — SPEC-0011 AC5.
 *
 * Usa la **stessa** stima del costruttore di scontri (ADR-0008): in tutta l'app c'è un solo metro
 * della difficoltà, quindi un incontro generato «impegnativo» risulta impegnativo anche quando lo
 * si apre nel costruttore. ⚠ Modulo puro (invariante I1).
 */
import { evaluateEncounter, type Difficulty, type EncounterEvaluation } from '../rules/encounter';
import { between, chance, pickMany, type Rng } from './random';

export interface EncounterCandidate {
  slug: string;
  name: string;
  cr: number;
  xp: number;
  type: string;
}

export interface GeneratedEncounter {
  entries: Array<{ slug: string; name: string; count: number; xp: number }>;
  evaluation: EncounterEvaluation;
  /** `false` se nessuna combinazione cadeva nella fascia: si restituisce la più vicina, e lo si dice. */
  exact: boolean;
}

/** Il punto centrale di ogni fascia, per scegliere la combinazione più vicina se nessuna ci cade. */
const BAND_CENTER: Record<Difficulty, number> = { banale: 0.2, facile: 0.6, impegnativo: 1.1, duro: 1.8, letale: 2.8 };

const ATTEMPTS = 200;

export function generateEncounter(
  rng: Rng,
  monsters: readonly EncounterCandidate[],
  party: { level: number; size: number },
  target: Difficulty,
  options: { type?: string } = {},
): GeneratedEncounter | null {
  const ofType = options.type ? monsters.filter((m) => m.type === options.type) : monsters;
  // Mostri di grado di sfida plausibile per il gruppo: né moscerini né divinità.
  const pool = ofType.filter((m) => m.cr >= party.level / 4 && m.cr <= party.level + 3 && m.xp > 0);
  const candidates = pool.length > 0 ? pool : ofType.filter((m) => m.xp > 0);
  if (candidates.length === 0 || party.size <= 0) return null;

  let best: GeneratedEncounter | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const kinds = pickMany(rng, candidates, chance(rng, 0.3) ? 2 : 1);
    const entries = kinds.map((monster) => ({
      slug: monster.slug,
      name: monster.name,
      xp: monster.xp,
      // I mostri deboli arrivano in gruppo, quelli forti da soli.
      count: monster.cr >= party.level ? between(rng, 1, 2) : between(rng, 1, 8),
    }));

    const evaluation = evaluateEncounter(entries, party);
    if (!evaluation.difficulty) continue;

    if (evaluation.difficulty === target) return { entries, evaluation, exact: true };

    const distance = Math.abs(evaluation.ratio - BAND_CENTER[target]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { entries, evaluation, exact: false };
    }
  }

  return best;
}

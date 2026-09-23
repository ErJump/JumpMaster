/** PNG al volo — SPEC-0011. ⚠ Modulo puro (invariante I1). */
import { ANCESTRIES, generateName, type Ancestry } from './names';
import { pick, type Rng } from './random';
import { APPEARANCES, MANNERS, OCCUPATIONS, SECRETS, VOICES, WANTS } from './tables';

export interface GeneratedNpc {
  name: string;
  ancestry: Ancestry;
  occupation: string;
  appearance: string;
  manner: string;
  want: string;
  /** ⚠️ Riservato al DM (AC10): finisce nel campo «segreto» della scheda. */
  secret: string;
  voice: string;
}

export function generateNpc(rng: Rng, options: { ancestry?: Ancestry; occupation?: string } = {}): GeneratedNpc {
  const ancestry = options.ancestry ?? pick(rng, ANCESTRIES);
  return {
    name: generateName(rng, ancestry).full,
    ancestry,
    occupation: options.occupation ?? pick(rng, OCCUPATIONS),
    appearance: pick(rng, APPEARANCES),
    manner: pick(rng, MANNERS),
    want: pick(rng, WANTS),
    secret: pick(rng, SECRETS),
    voice: pick(rng, VOICES),
  };
}

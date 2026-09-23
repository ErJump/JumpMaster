/** Taverne — SPEC-0011. ⚠ Modulo puro (invariante I1). */
import { generateNpc, type GeneratedNpc } from './npc';
import { generateRumor, type GeneratedRumor } from './rumor';
import { pick, type Rng } from './random';
import { DISHES, DRINKS, TAVERN_ADJECTIVES, TAVERN_ATMOSPHERES, TAVERN_NOUNS } from './tables';

export interface GeneratedTavern {
  name: string;
  keeper: GeneratedNpc;
  atmosphere: string;
  dish: string;
  drink: string;
  rumor: GeneratedRumor;
}

/**
 * Articolo determinativo italiano: «L’Orso», «Lo Scoiattolo», «Il Drago», «La Luna».
 * Sbagliarlo («Il Orso») è il tipo di errore che un giocatore nota subito.
 */
export function definiteArticle(word: string, gender: 'm' | 'f'): string {
  const lower = word.toLowerCase();
  if (/^[aeiouàèéìòù]/.test(lower)) return 'L’';
  if (gender === 'f') return 'La ';
  if (/^(s[bcdfgklmnpqrstvz]|z|gn|ps|pn|x|y)/.test(lower)) return 'Lo ';
  return 'Il ';
}

/** «Il Drago Ubriaco», «La Luna Zoppa», «L’Orso Dorato»: articolo e aggettivo concordano col nome. */
export function tavernName(rng: Rng): string {
  const noun = pick(rng, TAVERN_NOUNS);
  const adjective = pick(rng, TAVERN_ADJECTIVES);
  return `${definiteArticle(noun.word, noun.gender)}${noun.word} ${noun.gender === 'f' ? adjective.f : adjective.m}`;
}

export function generateTavern(rng: Rng): GeneratedTavern {
  return {
    name: tavernName(rng),
    keeper: generateNpc(rng, { occupation: 'oste' }),
    atmosphere: pick(rng, TAVERN_ATMOSPHERES),
    dish: pick(rng, DISHES),
    drink: pick(rng, DRINKS),
    rumor: generateRumor(rng),
  };
}

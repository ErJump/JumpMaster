/**
 * Matematica della scheda del personaggio.
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * Nulla di ciò che si calcola qui va salvato nel database: sarebbe una seconda fonte di verità,
 * e divergerebbe al primo passaggio di livello, quando il bonus di competenza cambia e qualcuno
 * dimentica di ricalcolare. Vedi SPEC-0005 design.
 *
 * Riferimento: SRD 5.1, «Ability Scores and Modifiers», «Using Each Ability».
 */
import { ABILITIES, abilityModifier, proficiencyBonus, passiveScore, type Ability } from './abilities';

export type AbilityScores = Record<Ability, number>;

/** Quanto conta la competenza in una prova: nessuna, semplice, o raddoppiata dall'esperienza. */
export type ProficiencyLevel = 'none' | 'proficient' | 'expertise';

export const SKILLS = [
  'acrobatics',
  'animal-handling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleight-of-hand',
  'stealth',
  'survival',
] as const;

export type Skill = (typeof SKILLS)[number];

/** Abilità → caratteristica associata e nomi nelle due lingue. SRD 5.1, «Using Each Ability». */
export const SKILL_INFO: Record<Skill, { ability: Ability; it: string; en: string }> = {
  acrobatics: { ability: 'dex', it: 'Acrobazia', en: 'Acrobatics' },
  'animal-handling': { ability: 'wis', it: 'Addestrare Animali', en: 'Animal Handling' },
  arcana: { ability: 'int', it: 'Arcano', en: 'Arcana' },
  athletics: { ability: 'str', it: 'Atletica', en: 'Athletics' },
  deception: { ability: 'cha', it: 'Inganno', en: 'Deception' },
  history: { ability: 'int', it: 'Storia', en: 'History' },
  insight: { ability: 'wis', it: 'Intuizione', en: 'Insight' },
  intimidation: { ability: 'cha', it: 'Intimidire', en: 'Intimidation' },
  investigation: { ability: 'int', it: 'Indagare', en: 'Investigation' },
  medicine: { ability: 'wis', it: 'Medicina', en: 'Medicine' },
  nature: { ability: 'int', it: 'Natura', en: 'Nature' },
  perception: { ability: 'wis', it: 'Percezione', en: 'Perception' },
  performance: { ability: 'cha', it: 'Intrattenere', en: 'Performance' },
  persuasion: { ability: 'cha', it: 'Persuasione', en: 'Persuasion' },
  religion: { ability: 'int', it: 'Religione', en: 'Religion' },
  'sleight-of-hand': { ability: 'dex', it: 'Rapidità di Mano', en: 'Sleight of Hand' },
  stealth: { ability: 'dex', it: 'Furtività', en: 'Stealth' },
  survival: { ability: 'wis', it: 'Sopravvivenza', en: 'Survival' },
};

/** Le tre abilità di cui al DM serve il punteggio passivo. */
export const PASSIVE_SKILLS = ['perception', 'investigation', 'insight'] as const satisfies readonly Skill[];

/** Punteggio di default quando un campo non è ancora stato compilato. */
export const DEFAULT_SCORES: AbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

export function abilityModifiers(scores: AbilityScores): Record<Ability, number> {
  const result = {} as Record<Ability, number>;
  for (const ability of ABILITIES) result[ability] = abilityModifier(scores[ability]);
  return result;
}

/** Bonus a un tiro salvezza: modificatore, più la competenza se il personaggio ce l'ha. */
export function savingThrow(scores: AbilityScores, ability: Ability, proficient: boolean, level: number): number {
  return abilityModifier(scores[ability]) + (proficient ? proficiencyBonus(level) : 0);
}

/** Moltiplicatore della competenza: l'esperienza la raddoppia. */
function proficiencyMultiplier(level: ProficiencyLevel): number {
  return level === 'expertise' ? 2 : level === 'proficient' ? 1 : 0;
}

/** Bonus a una prova di abilità. */
export function skillBonus(
  scores: AbilityScores,
  skill: Skill,
  proficiency: ProficiencyLevel,
  level: number,
): number {
  const info = SKILL_INFO[skill];
  return abilityModifier(scores[info.ability]) + proficiencyBonus(level) * proficiencyMultiplier(proficiency);
}

/**
 * Punteggio passivo di un'abilità: 10 + bonus.
 * È quanto il personaggio nota **senza cercare**, e il DM lo confronta con la CD di un nascondiglio.
 */
export function passiveSkill(
  scores: AbilityScores,
  skill: Skill,
  proficiency: ProficiencyLevel,
  level: number,
): number {
  const info = SKILL_INFO[skill];
  return passiveScore(abilityModifier(scores[info.ability]), {
    proficient: proficiency !== 'none',
    proficiencyBonus: proficiencyBonus(level) * proficiencyMultiplier(proficiency),
  });
}

/** Modificatore di iniziativa: il modificatore di Destrezza. */
export function initiativeModifier(scores: AbilityScores): number {
  return abilityModifier(scores.dex);
}

/**
 * Ponte fra la riga grezza del database e la scheda che si mostra.
 *
 * Tutto ciò che è calcolabile **si calcola qui**, non si salva (SPEC-0005 design): salvarlo
 * significherebbe una seconda fonte di verità, che diverge al primo passaggio di livello.
 */
import {
  ABILITIES,
  abilityModifiers,
  savingThrow,
  passiveSkill,
  skillBonus,
  initiativeModifier,
  proficiencyBonus,
  PASSIVE_SKILLS,
  SKILLS,
  type Ability,
  type AbilityScores,
  type ProficiencyLevel,
  type Skill,
} from '@/core/rules';
import type { Character } from '@/db/schema';

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

export interface DerivedCharacter {
  row: Character;
  scores: AbilityScores;
  modifiers: Record<Ability, number>;
  proficiencyBonus: number;
  initiative: number;
  saves: Record<Ability, { value: number; proficient: boolean }>;
  passives: Record<(typeof PASSIVE_SKILLS)[number], number>;
  skills: Array<{ skill: Skill; bonus: number; proficiency: ProficiencyLevel }>;
}

export function deriveCharacter(row: Character): DerivedCharacter {
  const scores: AbilityScores = {
    str: row.str,
    dex: row.dex,
    con: row.con,
    int: row.int,
    wis: row.wis,
    cha: row.cha,
  };

  const saveProficiencies = new Set(asList(row.saveProficiencies));
  const skillProficiencies = new Set(asList(row.skillProficiencies));
  const skillExpertise = new Set(asList(row.skillExpertise));

  const proficiencyFor = (skill: Skill): ProficiencyLevel =>
    skillExpertise.has(skill) ? 'expertise' : skillProficiencies.has(skill) ? 'proficient' : 'none';

  const saves = {} as DerivedCharacter['saves'];
  for (const ability of ABILITIES) {
    const proficient = saveProficiencies.has(ability);
    saves[ability] = { value: savingThrow(scores, ability, proficient, row.level), proficient };
  }

  const passives = {} as DerivedCharacter['passives'];
  for (const skill of PASSIVE_SKILLS) {
    passives[skill] = passiveSkill(scores, skill, proficiencyFor(skill), row.level);
  }

  return {
    row,
    scores,
    modifiers: abilityModifiers(scores),
    proficiencyBonus: proficiencyBonus(row.level),
    initiative: initiativeModifier(scores),
    saves,
    passives,
    skills: SKILLS.map((skill) => ({
      skill,
      bonus: skillBonus(scores, skill, proficiencyFor(skill), row.level),
      proficiency: proficiencyFor(skill),
    })),
  };
}

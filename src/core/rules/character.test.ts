import { describe, it, expect } from 'vitest';
import {
  SKILLS,
  SKILL_INFO,
  abilityModifiers,
  savingThrow,
  skillBonus,
  passiveSkill,
  initiativeModifier,
  type AbilityScores,
} from './character';

/** Un ladro di livello 5: competenza +3, Destrezza 18, Saggezza 14. */
const rogue: AbilityScores = { str: 10, dex: 18, con: 14, int: 12, wis: 14, cha: 16 };

describe('abilityModifiers', () => {
  it('calcola tutti e sei i modificatori', () => {
    expect(abilityModifiers(rogue)).toStrictEqual({ str: 0, dex: 4, con: 2, int: 1, wis: 2, cha: 3 });
  });
});

describe('savingThrow', () => {
  it('somma la competenza solo dove il personaggio ce l’ha', () => {
    // Livello 5 → competenza +3. Destrezza +4.
    expect(savingThrow(rogue, 'dex', true, 5)).toBe(7);
    expect(savingThrow(rogue, 'dex', false, 5)).toBe(4);
  });

  it('segue gli scatti del bonus di competenza', () => {
    expect(savingThrow(rogue, 'dex', true, 4)).toBe(6); // competenza +2
    expect(savingThrow(rogue, 'dex', true, 5)).toBe(7); // +3
    expect(savingThrow(rogue, 'dex', true, 17)).toBe(10); // +6
  });

  it('gestisce i modificatori negativi', () => {
    const debole: AbilityScores = { ...rogue, str: 6 };
    expect(savingThrow(debole, 'str', false, 5)).toBe(-2);
    expect(savingThrow(debole, 'str', true, 5)).toBe(1);
  });
});

describe('skillBonus', () => {
  it('usa la caratteristica giusta per ogni abilità', () => {
    // Furtività va su Destrezza (+4), Percezione su Saggezza (+2).
    expect(skillBonus(rogue, 'stealth', 'none', 5)).toBe(4);
    expect(skillBonus(rogue, 'perception', 'none', 5)).toBe(2);
  });

  it('l’esperienza raddoppia la competenza, non la somma due volte a caso', () => {
    expect(skillBonus(rogue, 'stealth', 'proficient', 5)).toBe(7); // 4 + 3
    expect(skillBonus(rogue, 'stealth', 'expertise', 5)).toBe(10); // 4 + 3×2
  });
});

describe('passiveSkill', () => {
  it('vale 10 più il bonus', () => {
    expect(passiveSkill(rogue, 'perception', 'none', 5)).toBe(12); // 10 + 2
    expect(passiveSkill(rogue, 'perception', 'proficient', 5)).toBe(15); // 10 + 2 + 3
    expect(passiveSkill(rogue, 'perception', 'expertise', 5)).toBe(18); // 10 + 2 + 6
  });

  it('riproduce il caso classico: elfo esploratore con Percezione competente', () => {
    // Saggezza 16 (+3), livello 1 (competenza +2), competente in Percezione.
    const ranger: AbilityScores = { ...rogue, wis: 16 };
    expect(passiveSkill(ranger, 'perception', 'proficient', 1)).toBe(15);
  });

  it('può scendere sotto 10 con una caratteristica bassa', () => {
    const distratto: AbilityScores = { ...rogue, wis: 6 };
    expect(passiveSkill(distratto, 'perception', 'none', 5)).toBe(8);
  });
});

describe('initiativeModifier', () => {
  it('è il modificatore di Destrezza, nient’altro', () => {
    expect(initiativeModifier(rogue)).toBe(4);
    expect(initiativeModifier({ ...rogue, dex: 8 })).toBe(-1);
  });
});

describe('SKILL_INFO', () => {
  it('copre tutte e 18 le abilità', () => {
    expect(SKILLS).toHaveLength(18);
    for (const skill of SKILLS) {
      expect(SKILL_INFO[skill]).toBeDefined();
      expect(SKILL_INFO[skill].it.trim()).not.toBe('');
    }
  });

  it('associa le abilità alle caratteristiche giuste', () => {
    // Le sviste qui si propagherebbero silenziosamente a tutta la scheda.
    expect(SKILL_INFO.athletics.ability).toBe('str');
    expect(SKILL_INFO.stealth.ability).toBe('dex');
    expect(SKILL_INFO.arcana.ability).toBe('int');
    expect(SKILL_INFO.perception.ability).toBe('wis');
    expect(SKILL_INFO.persuasion.ability).toBe('cha');
    expect(SKILL_INFO.investigation.ability).toBe('int'); // Indagare è INT, non SAG
    expect(SKILL_INFO.insight.ability).toBe('wis');
  });

  it('nessuna abilità va su Costituzione', () => {
    // In D&D 5e non esiste un'abilità basata su Costituzione.
    for (const skill of SKILLS) expect(SKILL_INFO[skill].ability).not.toBe('con');
  });
});

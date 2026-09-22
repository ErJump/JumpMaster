import { describe, it, expect } from 'vitest';
import {
  abilityModifier,
  formatModifier,
  proficiencyBonus,
  proficiencyBonusForCr,
  passiveScore,
  averageRoll,
} from './abilities';

describe('abilityModifier', () => {
  it('applica la formula (punteggio − 10) / 2 arrotondata per difetto', () => {
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0); // dispari: non arrotonda per eccesso
    expect(abilityModifier(12)).toBe(1);
    expect(abilityModifier(20)).toBe(5);
    expect(abilityModifier(30)).toBe(10);
  });

  it('arrotonda verso il BASSO anche sui negativi (la trappola di Math.trunc)', () => {
    // Math.trunc(-4.5) darebbe -4: sarebbe sbagliato.
    expect(abilityModifier(1)).toBe(-5);
    expect(abilityModifier(3)).toBe(-4);
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(9)).toBe(-1);
  });

  it('copre i punteggi reali dei mostri SRD', () => {
    expect(abilityModifier(21)).toBe(5); // Aboleth, Forza
    expect(abilityModifier(9)).toBe(-1); // Aboleth, Destrezza
  });
});

describe('formatModifier', () => {
  it('mette sempre il segno, anche sullo zero', () => {
    expect(formatModifier(3)).toBe('+3');
    expect(formatModifier(0)).toBe('+0');
    expect(formatModifier(-1)).toBe('-1');
  });
});

describe('proficiencyBonus', () => {
  it('sale di 1 ogni 4 livelli', () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(4)).toBe(2);
    expect(proficiencyBonus(5)).toBe(3); // primo scatto
    expect(proficiencyBonus(8)).toBe(3);
    expect(proficiencyBonus(9)).toBe(4);
    expect(proficiencyBonus(13)).toBe(5);
    expect(proficiencyBonus(17)).toBe(6);
    expect(proficiencyBonus(20)).toBe(6);
  });

  it('limita i livelli fuori scala invece di produrre numeri assurdi', () => {
    expect(proficiencyBonus(0)).toBe(2);
    expect(proficiencyBonus(-5)).toBe(2);
    expect(proficiencyBonus(99)).toBe(6);
  });
});

describe('proficiencyBonusForCr', () => {
  it('usa +2 per tutti i gradi di sfida sotto 1, frazionari inclusi', () => {
    expect(proficiencyBonusForCr(0)).toBe(2);
    expect(proficiencyBonusForCr(0.125)).toBe(2);
    expect(proficiencyBonusForCr(0.25)).toBe(2);
    expect(proficiencyBonusForCr(0.5)).toBe(2);
  });

  it('segue la tabella SRD per i gradi di sfida interi', () => {
    expect(proficiencyBonusForCr(1)).toBe(2);
    expect(proficiencyBonusForCr(4)).toBe(2);
    expect(proficiencyBonusForCr(5)).toBe(3);
    expect(proficiencyBonusForCr(9)).toBe(4);
    expect(proficiencyBonusForCr(10)).toBe(4); // Aboleth: +4, come sul manuale
    expect(proficiencyBonusForCr(17)).toBe(6);
    expect(proficiencyBonusForCr(21)).toBe(7);
    expect(proficiencyBonusForCr(30)).toBe(9);
  });
});

describe('passiveScore', () => {
  it('parte da 10 più il modificatore', () => {
    expect(passiveScore(3)).toBe(13);
    expect(passiveScore(-1)).toBe(9);
    expect(passiveScore(0)).toBe(10);
  });

  it('aggiunge la competenza solo quando è competente', () => {
    expect(passiveScore(2, { proficient: true, proficiencyBonus: 3 })).toBe(15);
    expect(passiveScore(2, { proficient: false, proficiencyBonus: 3 })).toBe(12);
    expect(passiveScore(2, { proficient: true })).toBe(12); // competente ma nessun bonus passato
  });

  it('riproduce la Percezione passiva 20 dell’Aboleth', () => {
    // SAG 15 → +2, competente in Percezione, bonus +4, esperienza (×2) sul manuale: 10+2+8 = 20
    expect(passiveScore(2, { proficient: true, proficiencyBonus: 8 })).toBe(20);
  });
});

describe('averageRoll', () => {
  it('calcola la media dei dadi vita', () => {
    expect(averageRoll('18d10+36')).toBe(135); // Aboleth: 135 PF sul manuale
    expect(averageRoll('2d8')).toBe(9);
    expect(averageRoll('1d6')).toBe(3);
  });

  it('gestisce i modificatori negativi e gli spazi', () => {
    expect(averageRoll('4d6-2')).toBe(12);
    expect(averageRoll(' 3d8 + 3 ')).toBe(16);
  });

  it('restituisce null su espressioni non valide invece di inventare numeri', () => {
    expect(averageRoll('non un tiro')).toBeNull();
    expect(averageRoll('')).toBeNull();
    expect(averageRoll('d20')).toBeNull(); // manca il numero di dadi
  });
});

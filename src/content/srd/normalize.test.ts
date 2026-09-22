import { describe, it, expect } from 'vitest';
import {
  joinDescription,
  primaryArmorClass,
  spellLevelLabel,
  rarityRank,
  normalizeMonster,
  normalizeSpell,
  normalizeMagicItem,
  normalizeEquipment,
} from './normalize';

describe('joinDescription', () => {
  it('gestisce sia la stringa sia l’array, perché l’SRD usa entrambi', () => {
    expect(joinDescription('una riga')).toBe('una riga');
    expect(joinDescription(['prima', 'seconda'])).toBe('prima\n\nseconda');
  });

  it('non esplode su valori assenti o inattesi', () => {
    expect(joinDescription(undefined)).toBe('');
    expect(joinDescription(null)).toBe('');
    expect(joinDescription(42)).toBe('');
    expect(joinDescription([1, 'valida', null])).toBe('valida');
  });
});

describe('primaryArmorClass', () => {
  it('estrae valore e tipo dalla prima voce', () => {
    expect(primaryArmorClass([{ type: 'natural', value: 17 }])).toStrictEqual({ value: 17, type: 'natural' });
  });

  it('ignora le CA condizionali, che sono la seconda voce', () => {
    // L'Ankheg ha CA 14 naturale e CA 11 da prono: la principale è la prima.
    const ankheg = [
      { type: 'natural', value: 14 },
      { type: 'condition', value: 11, condition: { index: 'prone' } },
    ];
    expect(primaryArmorClass(ankheg)).toStrictEqual({ value: 14, type: 'natural' });
  });

  it('ripiega su CA 10 se il dato manca, invece di produrre NaN', () => {
    expect(primaryArmorClass([])).toStrictEqual({ value: 10, type: null });
    expect(primaryArmorClass(undefined)).toStrictEqual({ value: 10, type: null });
    expect(primaryArmorClass([{ type: 'natural' }])).toStrictEqual({ value: 10, type: 'natural' });
  });
});

describe('spellLevelLabel', () => {
  it('chiama il livello 0 "Trucchetto"', () => {
    expect(spellLevelLabel(0)).toBe('Trucchetto');
    expect(spellLevelLabel(1)).toBe('Livello 1');
    expect(spellLevelLabel(9)).toBe('Livello 9');
  });
});

describe('rarityRank', () => {
  it('ordina le rarità dalla più comune alla più rara', () => {
    const order = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'].map(rarityRank);
    expect(order).toStrictEqual([0, 1, 2, 3, 4, 5]);
  });

  it('mette "Varies" in fondo e ignora maiuscole e spazi', () => {
    expect(rarityRank('Varies')).toBe(6);
    expect(rarityRank('  very rare ')).toBe(3);
  });

  it('non fallisce su rarità sconosciute', () => {
    expect(rarityRank('Mitica')).toBe(99);
  });
});

describe('normalizeMonster', () => {
  const aboleth = {
    index: 'aboleth',
    name: 'Aboleth',
    size: 'Large',
    type: 'aberration',
    alignment: 'lawful evil',
    armor_class: [{ type: 'natural', value: 17 }],
    hit_points: 135,
    hit_points_roll: '18d10+36',
    challenge_rating: 10,
    xp: 5900,
  };

  it('riproduce lo stat block dell’Aboleth come sul manuale', () => {
    expect(normalizeMonster(aboleth)).toMatchObject({
      slug: 'aboleth',
      name: 'Aboleth',
      cr: 10,
      crLabel: '10',
      xp: 5900,
      ac: 17,
      acType: 'natural',
      hp: 135,
      hitDice: '18d10+36',
      subtype: null,
    });
  });

  it('rende i gradi frazionari con la frazione tipografica', () => {
    expect(normalizeMonster({ ...aboleth, challenge_rating: 0.25 }).crLabel).toBe('¼');
    expect(normalizeMonster({ ...aboleth, challenge_rating: 0.125 }).crLabel).toBe('⅛');
    expect(normalizeMonster({ ...aboleth, challenge_rating: 0.5 }).crLabel).toBe('½');
  });

  it('tratta il sottotipo vuoto come assente', () => {
    expect(normalizeMonster({ ...aboleth, subtype: '' }).subtype).toBeNull();
    expect(normalizeMonster({ ...aboleth, subtype: 'devil' }).subtype).toBe('devil');
  });

  it('conserva il payload originale per non perdere nulla dell’SRD', () => {
    expect(normalizeMonster(aboleth).data).toBe(aboleth);
  });
});

describe('normalizeSpell', () => {
  it('appiattisce i riferimenti annidati di scuola e classi', () => {
    const row = normalizeSpell({
      index: 'aid',
      name: 'Aid',
      level: 2,
      school: { index: 'abjuration', name: 'Abjuration' },
      classes: [{ name: 'Cleric' }, { name: 'Paladin' }],
      components: ['V', 'S', 'M'],
      desc: ['Bolsters your allies.'],
      concentration: false,
      ritual: false,
      casting_time: '1 action',
      range: '30 feet',
      duration: '8 hours',
    });

    expect(row).toMatchObject({
      school: 'Abjuration',
      classes: 'Cleric, Paladin',
      components: 'V, S, M',
      levelLabel: 'Livello 2',
      concentration: false,
      ritual: false,
    });
  });

  it('converte concentrazione e rituale in booleani veri, non in valori ambigui', () => {
    const base = { index: 'x', name: 'X', level: 1 };
    expect(normalizeSpell({ ...base, concentration: true }).concentration).toBe(true);
    expect(normalizeSpell(base).concentration).toBe(false);
    expect(normalizeSpell({ ...base, ritual: true }).ritual).toBe(true);
  });
});

describe('normalizeMagicItem', () => {
  it('estrae la rarità dall’oggetto annidato', () => {
    const row = normalizeMagicItem({
      index: 'adamantine-armor',
      name: 'Adamantine Armor',
      equipment_category: { name: 'Armor' },
      rarity: { name: 'Uncommon' },
      desc: ['Armor (medium or heavy)', 'Critical hits become normal hits.'],
    });

    expect(row).toMatchObject({ category: 'Armor', rarity: 'Uncommon', rarityRank: 1 });
    expect(row.description).toContain('Critical hits');
  });

  it('ripiega su "Varies" quando la rarità manca', () => {
    expect(normalizeMagicItem({ index: 'x', name: 'X' })).toMatchObject({ rarity: 'Varies', rarityRank: 6 });
  });
});

describe('normalizeEquipment', () => {
  it('compone il danno unendo dadi e tipo', () => {
    const row = normalizeEquipment({
      index: 'club',
      name: 'Club',
      equipment_category: { name: 'Weapon' },
      category_range: 'Simple Melee',
      cost: { quantity: 1, unit: 'sp' },
      damage: { damage_dice: '1d4', damage_type: { name: 'Bludgeoning' } },
      weight: 2,
      properties: [{ name: 'Light' }, { name: 'Monk' }],
    });

    expect(row).toMatchObject({
      category: 'Weapon',
      subcategory: 'Simple Melee',
      costValue: 1,
      costUnit: 'sp',
      weight: 2,
      damage: '1d4 Bludgeoning',
      properties: 'Light, Monk',
    });
  });

  it('lascia a null i campi assenti invece di inventare zeri', () => {
    const row = normalizeEquipment({ index: 'rope', name: 'Rope', equipment_category: { name: 'Adventuring Gear' } });
    expect(row.damage).toBeNull();
    expect(row.properties).toBeNull();
    expect(row.costValue).toBeNull();
    expect(row.weight).toBeNull();
  });
});

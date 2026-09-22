import { describe, it, expect } from 'vitest';
import {
  formatSpeed,
  formatSenses,
  formatRefList,
  splitProficiencies,
  formatArmorClass,
  formatHitPoints,
} from './srd-format';

describe('formatSpeed', () => {
  it('non etichetta la camminata ma etichetta le altre andature', () => {
    expect(formatSpeed({ walk: '10 ft.', swim: '40 ft.' })).toBe('10 ft., swim 40 ft.');
    expect(formatSpeed({ walk: '30 ft.' })).toBe('30 ft.');
  });

  it('mette la camminata sempre per prima, qualunque sia l’ordine delle chiavi', () => {
    expect(formatSpeed({ fly: '60 ft.', walk: '20 ft.' })).toBe('20 ft., fly 60 ft.');
  });

  it('gestisce hover, che è un booleano e non una distanza', () => {
    expect(formatSpeed({ walk: '5 ft.', fly: '40 ft.', hover: true })).toBe('5 ft., fly 40 ft., hover');
  });

  it('non esplode se la camminata manca', () => {
    expect(formatSpeed({ swim: '30 ft.' })).toBe('swim 30 ft.');
    expect(formatSpeed({})).toBe('');
  });
});

describe('formatSenses', () => {
  it('mette la Percezione passiva per ultima, come sul manuale', () => {
    expect(formatSenses({ passive_perception: 20, darkvision: '120 ft.' })).toBe(
      'darkvision 120 ft., passive Perception 20',
    );
  });

  it('rende leggibili i nomi con underscore', () => {
    expect(formatSenses({ blindsight: '30 ft.', passive_perception: 12 })).toBe(
      'blindsight 30 ft., passive Perception 12',
    );
  });
});

describe('splitProficiencies', () => {
  it('separa tiri salvezza e abilità, che nell’SRD stanno nello stesso array', () => {
    const result = splitProficiencies([
      { value: 6, proficiency: { index: 'saving-throw-con', name: 'Saving Throw: CON' } },
      { value: 12, proficiency: { index: 'skill-history', name: 'Skill: History' } },
      { value: 8, proficiency: { index: 'saving-throw-int', name: 'Saving Throw: INT' } },
      { value: 10, proficiency: { index: 'skill-perception', name: 'Skill: Perception' } },
    ]);

    expect(result.savingThrows).toBe('CON +6, INT +8');
    expect(result.skills).toBe('History +12, Perception +10');
  });

  it('restituisce stringhe vuote quando non ci sono competenze', () => {
    expect(splitProficiencies([])).toStrictEqual({ savingThrows: '', skills: '' });
    expect(splitProficiencies(undefined)).toStrictEqual({ savingThrows: '', skills: '' });
  });

  it('mostra i modificatori negativi col segno giusto', () => {
    const result = splitProficiencies([
      { value: -1, proficiency: { index: 'skill-stealth', name: 'Skill: Stealth' } },
    ]);
    expect(result.skills).toBe('Stealth -1');
  });
});

describe('formatArmorClass', () => {
  it('annota l’armatura naturale', () => {
    expect(formatArmorClass([{ type: 'natural', value: 17 }])).toBe('17 (natural armor)');
  });

  it('elenca le armature indossate', () => {
    expect(
      formatArmorClass([
        { type: 'armor', value: 15, armor: [{ index: 'chain-shirt', name: 'Chain Shirt' }, { index: 'shield', name: 'Shield' }] },
      ]),
    ).toBe('15 (Chain Shirt, Shield)');
  });

  it('non annota nulla quando la CA viene dalla sola Destrezza', () => {
    expect(formatArmorClass([{ type: 'dex', value: 13 }])).toBe('13');
  });

  it('ripiega su 10 quando il dato manca', () => {
    expect(formatArmorClass(undefined)).toBe('10');
    expect(formatArmorClass([])).toBe('10');
  });
});

describe('formatHitPoints', () => {
  it('mostra media e tiro come sul manuale', () => {
    expect(formatHitPoints(135, '18d10+36')).toBe('135 (18d10 + 36)');
    expect(formatHitPoints(11, '2d8+2')).toBe('11 (2d8 + 2)');
  });

  it('mostra la sola media se il tiro non c’è', () => {
    expect(formatHitPoints(9, undefined)).toBe('9');
  });
});

describe('formatRefList', () => {
  it('unisce i nomi con la virgola', () => {
    expect(formatRefList([{ index: 'charmed', name: 'Charmed' }, { index: 'prone', name: 'Prone' }])).toBe(
      'Charmed, Prone',
    );
  });

  it('restituisce stringa vuota su elenco assente', () => {
    expect(formatRefList(undefined)).toBe('');
  });
});

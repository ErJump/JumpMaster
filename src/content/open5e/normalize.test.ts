/**
 * Conversione Open5e → SRD. La creatura di prova è inventata: il repository non contiene
 * contenuti Open5e (SPEC-0015 AC11), solo la loro forma.
 */
import { describe, it, expect } from 'vitest';
import { creatureSchema, type Open5eCreature } from './api';
import { damageTypeFromText, diceNotation, plainText, skillName, toMonsterRow, toSrdMonster } from './normalize';
import { parseDice } from '@/core/dice';
import { formatArmorClass, formatSenses, formatSpeed, splitProficiencies } from '@/lib/srd-format';

const attack = (overrides: Record<string, unknown> = {}) => ({
  name: 'attack',
  to_hit_mod: 6,
  damage_die_count: 2,
  damage_die_type: 'D6',
  damage_bonus: 4,
  damage_type: null,
  extra_damage_die_count: null,
  extra_damage_die_type: null,
  extra_damage_bonus: null,
  extra_damage_type: null,
  ...overrides,
});

const action = (overrides: Record<string, unknown>) => ({
  attacks: [],
  action_type: 'ACTION',
  order_in_statblock: 0,
  legendary_action_cost: null,
  usage_limits: null,
  ...overrides,
});

/** Il «Lanternaio di palude»: inventato per i test, con un po' di tutto. */
const RAW = {
  key: 'test_bog-lanternkeeper',
  name: 'Bog Lanternkeeper',
  document: { key: 'test' },
  size: { name: 'Large', key: 'large' },
  type: { name: 'Fey', key: 'fey' },
  subcategory: null,
  alignment: 'neutral evil',
  armor_class: 15,
  armor_detail: 'natural armor',
  hit_points: 52,
  hit_dice: '8d10 + 8',
  speed: { walk: 30, unit: 'feet', fly: 40, swim: 0, hover: true },
  ability_scores: { strength: 18, dexterity: 14, constitution: 12, intelligence: 9, wisdom: 13, charisma: 16 },
  saving_throws: { dexterity: 5, wisdom: 4 },
  skill_bonuses: { sleight_of_hand: 5, animal_handling: 4, perception: 4 },
  passive_perception: 14,
  darkvision_range: 60,
  blindsight_range: null,
  tremorsense_range: null,
  truesight_range: 10,
  languages: { as_string: 'Sylvan', data: [] },
  challenge_rating: 0.25,
  proficiency_bonus: null,
  experience_points: 50,
  resistances_and_immunities: {
    damage_immunities_display: '',
    damage_resistances_display: 'fire; bludgeoning from nonmagical attacks',
    damage_vulnerabilities_display: '',
    condition_immunities: [{ name: 'Charmed', key: 'charmed' }],
  },
  traits: [{ name: 'Marsh Glow', desc: 'The keeper sheds _dim light_ in a 10-foot radius.' }],
  actions: [
    action({ name: 'Lantern Swing', order_in_statblock: 2, desc: '_Melee Weapon Attack:_ +6 to hit, reach 10 ft. _Hit:_ 11 (2d6 + 4) bludgeoning damage plus 7 (2d6) fire damage.', attacks: [attack({ extra_damage_die_count: 2, extra_damage_die_type: 'D6', extra_damage_bonus: 0, extra_damage_type: { name: 'Fire', key: 'fire' } })] }),
    action({ name: 'Multiattack', order_in_statblock: 1, desc: 'The keeper makes two Lantern Swing attacks.' }),
    action({ name: 'Swamp Gas', order_in_statblock: 3, desc: 'Each creature within 15 ft. makes a DC 12 Con save.', usage_limits: { type: 'RECHARGE_ON_ROLL', param: 5 } }),
    action({ name: 'Beguile', order_in_statblock: 4, desc: 'One creature must succeed on a DC 13 Wis save.', usage_limits: { type: 'PER_DAY', param: 3 } }),
    action({ name: 'Flicker', action_type: 'BONUS_ACTION', order_in_statblock: 5, desc: 'The keeper teleports 15 ft.' }),
    action({ name: 'Snuff', action_type: 'REACTION', desc: 'The keeper dims its lantern.' }),
    action({ name: 'Drift', action_type: 'LEGENDARY_ACTION', legendary_action_cost: 1, desc: 'The keeper moves.' }),
    action({ name: 'Blaze', action_type: 'LEGENDARY_ACTION', legendary_action_cost: 2, order_in_statblock: 1, desc: 'Fire!' }),
    // Il doppione che Open5e mette fra le azioni normali (succede in 94 creature vere).
    action({ name: 'Blaze (Costs 2 Actions)', order_in_statblock: null, desc: 'Fire!' }),
  ],
  // Campi che l'app non usa: devono essere ignorati, non rifiutati.
  environments: [],
  illustration: null,
};

const creature: Open5eCreature = creatureSchema.parse(RAW);
const monster = toSrdMonster(creature);

describe('toSrdMonster — il formato che lo stat block sa impaginare', () => {
  it('GS frazionario: ¼ e i suoi PE', () => {
    const row = toMonsterRow(creature);
    expect(row.cr).toBe(0.25);
    expect(row.crLabel).toBe('¼');
    expect(row.xp).toBe(50);
    expect(row.slug).toBe('test_bog-lanternkeeper');
    expect(row.documentKey).toBe('test');
  });

  it('CA, PF, velocità e sensi come sul manuale', () => {
    expect(formatArmorClass(monster.armor_class)).toBe('15 (natural armor)');
    expect(monster.hit_points_roll).toBe('8d10+8');
    // Le velocità a 0 non esistono sul manuale; «hover» sì.
    expect(formatSpeed(monster.speed)).toBe('30 ft., fly 40 ft., hover');
    expect(formatSenses(monster.senses)).toBe('darkvision 60 ft., truesight 10 ft., passive Perception 14');
    expect(monster.type).toBe('fey');
  });

  it('CA senza dettaglio: è la sola Destrezza, e non si annota', () => {
    const plain = toSrdMonster(creatureSchema.parse({ ...RAW, armor_detail: '' }));
    expect(formatArmorClass(plain.armor_class)).toBe('15');
    const armored = toSrdMonster(creatureSchema.parse({ ...RAW, armor_detail: 'chain shirt' }));
    expect(formatArmorClass(armored.armor_class)).toBe('15 (chain shirt)');
  });

  it('tiri salvezza e abilità separati, con i nomi del manuale', () => {
    expect(splitProficiencies(monster.proficiencies)).toStrictEqual({
      savingThrows: 'DEX +5, WIS +4',
      skills: 'Sleight of Hand +5, Animal Handling +4, Perception +4',
    });
  });

  it('attacchi cliccabili: bonus e dadi del danno, con il tipo', () => {
    const swing = monster.actions?.find((a) => a.name === 'Lantern Swing');
    expect(swing?.attack_bonus).toBe(6);
    expect(swing?.damage).toStrictEqual([
      { damage_dice: '2d6+4', damage_type: { index: 'bludgeoning', name: 'Bludgeoning' } },
      { damage_dice: '2d6', damage_type: { index: 'fire', name: 'Fire' } },
    ]);
    // Ogni dado prodotto deve essere tirabile dal nostro motore.
    for (const entry of swing?.damage ?? []) expect(() => parseDice(entry.damage_dice!)).not.toThrow();
  });

  it('azioni nell’ordine dello stat block, con limiti d’uso e azioni bonus nel nome', () => {
    expect(monster.actions?.map((a) => a.name)).toStrictEqual([
      'Multiattack',
      'Lantern Swing',
      'Swamp Gas (Recharge 5-6)',
      'Beguile (3/Day)',
      'Flicker (Bonus Action)',
    ]);
    expect(monster.reactions?.map((a) => a.name)).toStrictEqual(['Snuff']);
    expect(monster.legendary_actions?.map((a) => a.name)).toStrictEqual(['Drift', 'Blaze (Costs 2 Actions)']);
  });

  it('tratti, resistenze e immunità', () => {
    expect(monster.special_abilities).toStrictEqual([{ name: 'Marsh Glow', desc: 'The keeper sheds dim light in a 10-foot radius.' }]);
    expect(monster.damage_resistances).toStrictEqual(['fire; bludgeoning from nonmagical attacks']);
    expect(monster.damage_immunities).toStrictEqual([]);
    expect(monster.condition_immunities).toStrictEqual([{ index: 'charmed', name: 'Charmed' }]);
  });

  it('il corsivo Markdown sparisce dal testo', () => {
    expect(monster.actions?.find((a) => a.name === 'Lantern Swing')?.desc).toBe(
      'Melee Weapon Attack: +6 to hit, reach 10 ft. Hit: 11 (2d6 + 4) bludgeoning damage plus 7 (2d6) fire damage.',
    );
  });
});

describe('pezzi della conversione', () => {
  it('diceNotation', () => {
    expect(diceNotation(2, 'D8', 3)).toBe('2d8+3');
    expect(diceNotation(1, 'D6', -1)).toBe('1d6-1');
    expect(diceNotation(4, 'D10', 0)).toBe('4d10');
    expect(diceNotation(null, 'D6', 2)).toBeNull();
    expect(diceNotation(2, null, 2)).toBeNull();
  });

  it('damageTypeFromText: il tipo solo se è uno e uno solo', () => {
    expect(damageTypeFromText('Hit: 8 (1d8 + 4) piercing damage.', '1d8+4')).toBe('piercing');
    expect(damageTypeFromText('Hit: 27 (5d8+5) cold damage.', '5d8+5')).toBe('cold');
    expect(damageTypeFromText('Hit: 1 (1d6 − 2) bludgeoning damage.', '1d6-2')).toBe('bludgeoning');
    expect(damageTypeFromText('Hit: 29 (4d10 + 7) bludgeoning or slashing damage.', '4d10+7')).toBeNull();
    expect(damageTypeFromText('Hit: 7 (2d6) acid, cold, fire, or lightning damage.', '2d6')).toBeNull();
    // Dadi diversi da quelli dell'attacco: non si prende il tipo di un altro danno.
    expect(damageTypeFromText('Hit: 8 (1d8 + 4) piercing damage.', '2d6')).toBeNull();
  });

  it('skillName', () => {
    expect(skillName('sleight_of_hand')).toBe('Sleight of Hand');
    expect(skillName('animal_handling')).toBe('Animal Handling');
    expect(skillName('perception')).toBe('Perception');
  });

  it('plainText non tocca le parole con il trattino basso in mezzo', () => {
    expect(plainText('_Hit:_ 5 (1d6 + 2) damage')).toBe('Hit: 5 (1d6 + 2) damage');
    expect(plainText('**Bold** text')).toBe('Bold text');
    expect(plainText('snake_case_word')).toBe('snake_case_word');
  });
});

describe('creatureSchema — la risposta di Open5e è input esterno', () => {
  it('rifiuta una creatura senza caratteristiche', () => {
    const broken = Object.fromEntries(Object.entries(RAW).filter(([key]) => key !== 'ability_scores'));
    expect(creatureSchema.safeParse(broken).success).toBe(false);
  });

  it('rifiuta un grado di sfida impossibile', () => {
    expect(creatureSchema.safeParse({ ...RAW, challenge_rating: 99 }).success).toBe(false);
  });
});

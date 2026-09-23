/**
 * Creatura Open5e → formato SRD (SPEC-0015 AC9, ADR-0013).
 *
 * Lo stat block, il costruttore di scontri e il combat tracker leggono un solo formato, quello
 * dell'SRD. Convertire qui, una volta, all'import, vuol dire non avere due stat block.
 *
 * Funzioni pure: i test le provano su creature scritte a mano, senza rete.
 */
import { crLabel } from '@/core/rules';
import type { SrdAction, SrdDamage, SrdMonsterData, SrdProficiency } from '@/lib/srd-types';
import type { Open5eAction, Open5eAttack, Open5eCreature } from './api';

const ABILITY_ABBR: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

const DAMAGE_TYPES = new Set([
  'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder',
]);

const titleCase = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const SMALL_WORDS = new Set(['of', 'and']);

/** `sleight_of_hand` → `Sleight of Hand`, come sul manuale. */
export function skillName(key: string): string {
  return key
    .split('_')
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word) ? word : titleCase(word)))
    .join(' ');
}

/** Il testo di Open5e usa a volte il corsivo Markdown (`_Hit:_`); lo stat block mostra testo semplice. */
export function plainText(text: string): string {
  return text.replace(/(\*\*|__|\b_)(\S(?:.*?\S)?)\1(?!\w)/g, '$2').replace(/\r\n/g, '\n');
}

/** `2`, `D8`, `4` → `2d8+4`. `null` se i dadi mancano. */
export function diceNotation(count: number | null | undefined, die: string | null | undefined, bonus: number | null | undefined): string | null {
  if (!count || !die) return null;
  const sides = /^d?(\d+)$/i.exec(die)?.[1];
  if (!sides) return null;
  const base = `${count}d${sides}`;
  if (!bonus) return base;
  return bonus > 0 ? `${base}+${bonus}` : `${base}${bonus}`;
}

/**
 * Open5e non valorizza il tipo di danno dell'attacco (`damage_type` è sempre `null`). Il testo però
 * lo dice: «Hit: 8 (1d8 + 4) bludgeoning damage». Si cerca proprio quei dadi e si prende il tipo
 * **solo se è uno e uno solo**: «bludgeoning or slashing» resta senza tipo, piuttosto che sbagliato.
 */
export function damageTypeFromText(desc: string, notation: string): string | null {
  const match = /^(\d+d\d+)(?:([+-])(\d+))?$/.exec(notation);
  if (!match) return null;
  const [, dice, sign, amount] = match;
  const bonus = sign ? `\\s*[${sign === '+' ? '+' : '-−–'}]\\s*${amount}` : '';
  const found = new RegExp(`\\(${dice}${bonus}\\)\\s+([a-z ,]+?)\\s+damage`, 'i').exec(desc);
  const phrase = found?.[1]?.trim().toLowerCase();
  return phrase && DAMAGE_TYPES.has(phrase) ? phrase : null;
}

function damageEntry(notation: string | null, type: string | null): SrdDamage[] {
  if (!notation) return [];
  return [type ? { damage_dice: notation, damage_type: { index: type, name: titleCase(type) } } : { damage_dice: notation }];
}

function attackDamage(attack: Open5eAttack, desc: string): SrdDamage[] {
  const main = diceNotation(attack.damage_die_count, attack.damage_die_type, attack.damage_bonus);
  const extra = diceNotation(attack.extra_damage_die_count, attack.extra_damage_die_type, attack.extra_damage_bonus);
  return [
    ...damageEntry(main, attack.damage_type?.key ?? (main ? damageTypeFromText(desc, main) : null)),
    ...damageEntry(extra, attack.extra_damage_type?.key ?? (extra ? damageTypeFromText(desc, extra) : null)),
  ];
}

/** I limiti d'uso vanno nel nome, come nell'SRD: «Fire Breath (Recharge 5-6)», «Enslave (3/Day)». */
function actionName(action: Open5eAction): string {
  let name = action.name;
  const limit = action.usage_limits;
  if (limit && !name.includes('(')) {
    if (limit.type === 'PER_DAY' && limit.param) name += ` (${limit.param}/Day)`;
    else if (limit.type === 'RECHARGE_ON_ROLL' && limit.param) name += limit.param >= 6 ? ' (Recharge 6)' : ` (Recharge ${limit.param}-6)`;
    else if (limit.type === 'RECHARGE_AFTER_REST') name += ' (Recharges after a Short or Long Rest)';
  }
  if (action.action_type === 'BONUS_ACTION') name += ' (Bonus Action)';
  if (action.action_type === 'LEGENDARY_ACTION' && action.legendary_action_cost && action.legendary_action_cost > 1) {
    name += ` (Costs ${action.legendary_action_cost} Actions)`;
  }
  return name;
}

function toSrdAction(action: Open5eAction): SrdAction {
  const desc = plainText(action.desc);
  const attack = action.attacks[0];
  const out: SrdAction = { name: actionName(action), desc };
  if (attack && typeof attack.to_hit_mod === 'number') out.attack_bonus = attack.to_hit_mod;
  const damage = attack ? attackDamage(attack, desc) : [];
  if (damage.length > 0) out.damage = damage;
  return out;
}

/**
 * Open5e ripete 94 azioni leggendarie anche fra le azioni normali, col nome «Wing Attack (Costs 2
 * Actions)». Quella dicitura non appartiene mai a un'azione normale: è un doppione, e si scarta.
 */
const LEGENDARY_COST = /\(costs \d+ actions?\)/i;

function actionsOfType(creature: Open5eCreature, ...types: string[]): SrdAction[] {
  return creature.actions
    .filter((action) => types.includes(action.action_type))
    .filter((action) => action.action_type === 'LEGENDARY_ACTION' || !LEGENDARY_COST.test(action.name))
    // Le azioni senza posizione vanno in fondo, non in testa.
    .sort((a, b) => (a.order_in_statblock ?? Number.MAX_SAFE_INTEGER) - (b.order_in_statblock ?? Number.MAX_SAFE_INTEGER))
    .map(toSrdAction);
}

function proficiencies(creature: Open5eCreature): SrdProficiency[] {
  const saves = Object.entries(creature.saving_throws).flatMap(([ability, value]) => {
    const abbr = ABILITY_ABBR[ability];
    return abbr ? [{ value, proficiency: { index: `saving-throw-${abbr.toLowerCase()}`, name: `Saving Throw: ${abbr}` } }] : [];
  });
  const skills = Object.entries(creature.skill_bonuses).map(([skill, value]) => ({
    value,
    proficiency: { index: `skill-${skill.replace(/_/g, '-')}`, name: `Skill: ${skillName(skill)}` },
  }));
  return [...saves, ...skills];
}

function speed(creature: Open5eCreature): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const [mode, value] of Object.entries(creature.speed)) {
    if (mode === 'unit') continue;
    if (value === true) out[mode] = true;
    else if (typeof value === 'number' && (value > 0 || mode === 'walk')) out[mode] = `${value} ft.`;
  }
  return out;
}

function senses(creature: Open5eCreature): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const ranges = [
    ['blindsight', creature.blindsight_range],
    ['darkvision', creature.darkvision_range],
    ['tremorsense', creature.tremorsense_range],
    ['truesight', creature.truesight_range],
  ] as const;
  for (const [sense, range] of ranges) if (range) out[sense] = `${range} ft.`;
  if (typeof creature.passive_perception === 'number') out.passive_perception = creature.passive_perception;
  return out;
}

const list = (display: string | undefined) => (display && display.trim() ? [display.trim()] : []);

/** La forma SRD della creatura: quella che lo stat block sa impaginare. */
export function toSrdMonster(creature: Open5eCreature): SrdMonsterData {
  const detail = creature.armor_detail?.trim() ?? '';
  const ri = creature.resistances_and_immunities;
  const data: SrdMonsterData = {
    index: creature.key,
    name: creature.name,
    size: creature.size.name,
    type: creature.type.name.toLowerCase(),
    subtype: creature.subcategory ?? null,
    alignment: creature.alignment,
    // «natural armor» si scrive `natural` nell'SRD; senza dettaglio è la sola Destrezza.
    armor_class: [{ type: detail === '' ? 'dex' : detail === 'natural armor' ? 'natural' : detail, value: creature.armor_class }],
    hit_points: creature.hit_points,
    speed: speed(creature),
    strength: creature.ability_scores.strength,
    dexterity: creature.ability_scores.dexterity,
    constitution: creature.ability_scores.constitution,
    intelligence: creature.ability_scores.intelligence,
    wisdom: creature.ability_scores.wisdom,
    charisma: creature.ability_scores.charisma,
    proficiencies: proficiencies(creature),
    damage_vulnerabilities: list(ri.damage_vulnerabilities_display),
    damage_resistances: list(ri.damage_resistances_display),
    damage_immunities: list(ri.damage_immunities_display),
    condition_immunities: (ri.condition_immunities ?? []).map((c) => ({ index: c.key, name: c.name })),
    senses: senses(creature),
    languages: creature.languages?.as_string ?? '',
    challenge_rating: creature.challenge_rating,
    xp: creature.experience_points,
    special_abilities: creature.traits.map((trait) => ({ name: trait.name, desc: plainText(trait.desc) })),
    actions: actionsOfType(creature, 'ACTION', 'BONUS_ACTION'),
    reactions: actionsOfType(creature, 'REACTION'),
    legendary_actions: actionsOfType(creature, 'LEGENDARY_ACTION'),
  };
  if (creature.hit_dice) data.hit_points_roll = creature.hit_dice.replace(/\s+/g, '');
  if (typeof creature.proficiency_bonus === 'number') data.proficiency_bonus = creature.proficiency_bonus;
  return data;
}

export interface Open5eMonsterRow {
  slug: string;
  documentKey: string;
  name: string;
  size: string;
  type: string;
  subtype: string | null;
  alignment: string;
  cr: number;
  crLabel: string;
  xp: number;
  ac: number;
  acType: string | null;
  hp: number;
  hitDice: string | null;
  data: SrdMonsterData;
}

/** La riga di `open5e_monsters`: colonne per cercare e filtrare, lo stat block completo in `data`. */
export function toMonsterRow(creature: Open5eCreature): Open5eMonsterRow {
  const data = toSrdMonster(creature);
  return {
    slug: creature.key,
    documentKey: creature.document.key,
    name: data.name,
    size: data.size,
    type: data.type,
    subtype: data.subtype ?? null,
    alignment: data.alignment,
    cr: data.challenge_rating,
    crLabel: crLabel(data.challenge_rating),
    xp: data.xp,
    ac: creature.armor_class,
    acType: data.armor_class[0]?.type ?? null,
    hp: data.hit_points,
    hitDice: data.hit_points_roll ?? null,
    data,
  };
}

/**
 * Normalizzazione dei dati SRD grezzi verso le righe delle tabelle `srd_*`.
 *
 * Funzioni pure e testate: sono il punto in cui i dati di terze parti diventano i nostri,
 * ed è qui che si annidano le sorprese (campi assenti, array dove ci si aspetta un valore,
 * gradi di sfida frazionari).
 *
 * Nota: questo file vive in `src/content/`, non in `src/core/`, perché conosce la forma
 * dei dati SRD. Resta comunque privo di dipendenze da React e dal database.
 */
import { crLabel } from '@/core/rules';

/* ── utilità ──────────────────────────────────────────────────────── */

/** I campi `desc` dell'SRD sono a volte una stringa, a volte un array di righe. */
export function joinDescription(desc: unknown): string {
  if (typeof desc === 'string') return desc;
  if (Array.isArray(desc)) return desc.filter((line) => typeof line === 'string').join('\n\n');
  return '';
}

/** Estrae il `name` da un riferimento SRD (`{ index, name, url }`). */
function refName(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return '';
}

function refNames(value: unknown): string[] {
  return Array.isArray(value) ? value.map(refName).filter(Boolean) : [];
}

/* ── mostri ───────────────────────────────────────────────────────── */

/**
 * La Classe Armatura è un array: 327 mostri su 334 ne hanno una sola, ma 7 hanno una
 * seconda voce condizionale (per esempio l'Ankheg, che ha CA 11 da prono).
 * Prendiamo la prima come CA principale; l'array completo resta in `data`.
 */
export function primaryArmorClass(armorClass: unknown): { value: number; type: string | null } {
  if (!Array.isArray(armorClass) || armorClass.length === 0) return { value: 10, type: null };

  const first = armorClass[0] as { value?: unknown; type?: unknown };
  return {
    value: typeof first.value === 'number' ? first.value : 10,
    type: typeof first.type === 'string' ? first.type : null,
  };
}

export interface MonsterRow {
  slug: string;
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
  data: unknown;
}

export function normalizeMonster(raw: Record<string, unknown>): MonsterRow {
  const cr = typeof raw.challenge_rating === 'number' ? raw.challenge_rating : 0;
  const ac = primaryArmorClass(raw.armor_class);

  return {
    slug: String(raw.index),
    name: String(raw.name),
    size: String(raw.size ?? ''),
    type: String(raw.type ?? ''),
    subtype: typeof raw.subtype === 'string' && raw.subtype !== '' ? raw.subtype : null,
    alignment: String(raw.alignment ?? ''),
    cr,
    crLabel: crLabel(cr),
    xp: typeof raw.xp === 'number' ? raw.xp : 0,
    ac: ac.value,
    acType: ac.type,
    hp: typeof raw.hit_points === 'number' ? raw.hit_points : 0,
    hitDice: typeof raw.hit_points_roll === 'string' ? raw.hit_points_roll : null,
    data: raw,
  };
}

/* ── incantesimi ──────────────────────────────────────────────────── */

/** Livello 0 si dice "Trucchetto", non "Livello 0" (SPEC-0003 AC10). */
export function spellLevelLabel(level: number): string {
  return level === 0 ? 'Trucchetto' : `Livello ${level}`;
}

export interface SpellRow {
  slug: string;
  name: string;
  level: number;
  levelLabel: string;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  components: string;
  classes: string;
  description: string;
  data: unknown;
}

export function normalizeSpell(raw: Record<string, unknown>): SpellRow {
  const level = typeof raw.level === 'number' ? raw.level : 0;
  const components = Array.isArray(raw.components) ? raw.components.join(', ') : '';

  return {
    slug: String(raw.index),
    name: String(raw.name),
    level,
    levelLabel: spellLevelLabel(level),
    school: refName(raw.school),
    castingTime: String(raw.casting_time ?? ''),
    range: String(raw.range ?? ''),
    duration: String(raw.duration ?? ''),
    concentration: raw.concentration === true,
    ritual: raw.ritual === true,
    components,
    classes: refNames(raw.classes).join(', '),
    description: joinDescription(raw.desc),
    data: raw,
  };
}

/* ── oggetti magici ───────────────────────────────────────────────── */

/** Ordine di rarità, per poter ordinare con un intero invece che con stringhe. */
const RARITY_RANK: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  'very rare': 3,
  legendary: 4,
  artifact: 5,
  varies: 6,
};

export function rarityRank(rarity: string): number {
  return RARITY_RANK[rarity.trim().toLowerCase()] ?? 99;
}

export interface MagicItemRow {
  slug: string;
  name: string;
  category: string;
  rarity: string;
  rarityRank: number;
  description: string;
  data: unknown;
}

export function normalizeMagicItem(raw: Record<string, unknown>): MagicItemRow {
  const rarity = refName(raw.rarity) || 'Varies';

  return {
    slug: String(raw.index),
    name: String(raw.name),
    category: refName(raw.equipment_category),
    rarity,
    rarityRank: rarityRank(rarity),
    description: joinDescription(raw.desc),
    data: raw,
  };
}

/* ── equipaggiamento ──────────────────────────────────────────────── */

export interface EquipmentRow {
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  costValue: number | null;
  costUnit: string | null;
  weight: number | null;
  damage: string | null;
  properties: string | null;
  data: unknown;
}

export function normalizeEquipment(raw: Record<string, unknown>): EquipmentRow {
  const cost = raw.cost as { quantity?: unknown; unit?: unknown } | undefined;
  const damage = raw.damage as { damage_dice?: unknown; damage_type?: unknown } | undefined;

  const damageText =
    damage && typeof damage.damage_dice === 'string'
      ? `${damage.damage_dice} ${refName(damage.damage_type)}`.trim()
      : null;

  const properties = refNames(raw.properties);

  return {
    slug: String(raw.index),
    name: String(raw.name),
    category: refName(raw.equipment_category),
    subcategory: typeof raw.category_range === 'string' ? raw.category_range : null,
    costValue: cost && typeof cost.quantity === 'number' ? cost.quantity : null,
    costUnit: cost && typeof cost.unit === 'string' ? cost.unit : null,
    weight: typeof raw.weight === 'number' ? raw.weight : null,
    damage: damageText,
    properties: properties.length > 0 ? properties.join(', ') : null,
    data: raw,
  };
}

/* ── regole, condizioni, privilegi, classi, razze, background ─────── */

export function normalizeRuleSection(raw: Record<string, unknown>) {
  return {
    slug: String(raw.index),
    name: String(raw.name),
    description: joinDescription(raw.desc),
  };
}

export function normalizeCondition(raw: Record<string, unknown>) {
  return {
    slug: String(raw.index),
    name: String(raw.name),
    description: joinDescription(raw.desc),
  };
}

export function normalizeFeature(raw: Record<string, unknown>) {
  return {
    slug: String(raw.index),
    name: String(raw.name),
    className: refName(raw.class),
    level: typeof raw.level === 'number' ? raw.level : 0,
    description: joinDescription(raw.desc),
  };
}

export function normalizeClass(raw: Record<string, unknown>) {
  return {
    slug: String(raw.index),
    name: String(raw.name),
    hitDie: typeof raw.hit_die === 'number' ? raw.hit_die : 0,
    data: raw,
  };
}

export function normalizeRace(raw: Record<string, unknown>) {
  return {
    slug: String(raw.index),
    name: String(raw.name),
    speed: typeof raw.speed === 'number' ? raw.speed : 0,
    size: String(raw.size ?? ''),
    data: raw,
  };
}

export function normalizeBackground(raw: Record<string, unknown>) {
  return {
    slug: String(raw.index),
    name: String(raw.name),
    data: raw,
  };
}

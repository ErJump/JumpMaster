/**
 * Forma dei payload SRD conservati nella colonna `data` delle tabelle `srd_*`.
 *
 * Non è una validazione: i dati entrano dall'importer, che li ha già normalizzati.
 * Servono a dare tipi a chi li legge, senza spargere `any` per l'applicazione.
 */

export interface SrdRef {
  index: string;
  name: string;
  url?: string;
}

export interface SrdDamage {
  damage_dice?: string;
  damage_type?: SrdRef;
}

export interface SrdAction {
  name: string;
  desc: string;
  attack_bonus?: number;
  damage?: SrdDamage[];
  dc?: { dc_type?: SrdRef; dc_value?: number; success_type?: string };
  usage?: { type?: string; times?: number; dice?: string; min_value?: number };
}

export interface SrdProficiency {
  value: number;
  proficiency: SrdRef;
}

export interface SrdArmorClass {
  type: string;
  value: number;
  condition?: SrdRef;
  armor?: SrdRef[];
}

export interface SrdMonsterData {
  index: string;
  name: string;
  size: string;
  type: string;
  subtype?: string | null;
  alignment: string;
  armor_class: SrdArmorClass[];
  hit_points: number;
  hit_points_roll?: string;
  speed: Record<string, string | boolean>;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiencies: SrdProficiency[];
  damage_vulnerabilities: string[];
  damage_resistances: string[];
  damage_immunities: string[];
  condition_immunities: SrdRef[];
  senses: Record<string, string | number>;
  languages: string;
  challenge_rating: number;
  proficiency_bonus?: number;
  xp: number;
  special_abilities?: SrdAction[];
  actions?: SrdAction[];
  reactions?: SrdAction[];
  legendary_actions?: SrdAction[];
}

export interface SrdSpellData {
  index: string;
  name: string;
  desc: string[];
  higher_level?: string[];
  range: string;
  components: string[];
  material?: string;
  ritual: boolean;
  duration: string;
  concentration: boolean;
  casting_time: string;
  level: number;
  school: SrdRef;
  classes: SrdRef[];
  attack_type?: string;
  damage?: { damage_type?: SrdRef; damage_at_slot_level?: Record<string, string>; damage_at_character_level?: Record<string, string> };
}

export interface SrdMagicItemData {
  index: string;
  name: string;
  equipment_category: SrdRef;
  rarity: { name: string };
  desc: string[];
}

export interface SrdEquipmentData {
  index: string;
  name: string;
  equipment_category: SrdRef;
  weapon_category?: string;
  weapon_range?: string;
  category_range?: string;
  cost?: { quantity: number; unit: string };
  damage?: SrdDamage;
  two_handed_damage?: SrdDamage;
  range?: { normal?: number; long?: number };
  weight?: number;
  properties?: SrdRef[];
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  desc?: string[];
}

/**
 * Da dove viene il mostro: SRD o un manuale Open5e (ADR-0013). La licenza lo richiede, e il DM
 * deve sapere se sta usando un mostro «ufficiale» o di un altro editore.
 */
export interface MonsterSource {
  title: string;
  publisher: string;
  href?: string;
  /** Il servizio da cui è stato scaricato, se non viene direttamente dall'editore. */
  via?: string;
  licenses: Array<{ name: string; href: string }>;
}

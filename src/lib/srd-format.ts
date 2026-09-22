/**
 * Formattatori per i campi SRD che arrivano in forme scomode (oggetti, array, chiavi variabili).
 *
 * Funzioni pure e testate: sono il confine fra la forma dei dati di terzi e ciò che
 * il DM legge sullo schermo.
 */
import { formatModifier } from '@/core/rules';
import type { SrdProficiency, SrdRef } from './srd-types';

/**
 * Velocità: `{ walk: "10 ft.", swim: "40 ft." }` → `"10 ft., swim 40 ft."`
 * La camminata non si etichetta, come sul manuale; le altre sì.
 */
export function formatSpeed(speed: Record<string, string | boolean>): string {
  const parts: string[] = [];

  const walk = speed.walk;
  if (typeof walk === 'string') parts.push(walk);

  for (const [mode, value] of Object.entries(speed)) {
    if (mode === 'walk') continue;
    if (value === true) parts.push(mode); // es. "hover"
    else if (typeof value === 'string') parts.push(`${mode} ${value}`);
  }

  return parts.join(', ');
}

/**
 * Sensi: la Percezione passiva va per ultima, come sul manuale.
 * `{ darkvision: "120 ft.", passive_perception: 20 }` → `"darkvision 120 ft., passive Perception 20"`
 */
export function formatSenses(senses: Record<string, string | number>): string {
  const parts: string[] = [];

  for (const [sense, value] of Object.entries(senses)) {
    if (sense === 'passive_perception') continue;
    parts.push(`${sense.replace(/_/g, ' ')} ${value}`);
  }

  if (senses.passive_perception !== undefined) {
    parts.push(`passive Perception ${senses.passive_perception}`);
  }

  return parts.join(', ');
}

/** Nomi separati da virgola da un elenco di riferimenti SRD. */
export function formatRefList(refs: SrdRef[] | undefined): string {
  return (refs ?? []).map((ref) => ref.name).join(', ');
}

/**
 * Le competenze dell'SRD mescolano tiri salvezza e abilità in un solo array, distinguibili
 * dal prefisso dell'indice (`saving-throw-con`, `skill-history`). Qui li separiamo e li
 * rendiamo come sul manuale: `"Con +6, Int +8, Wis +6"` / `"History +12, Perception +10"`.
 */
export function splitProficiencies(proficiencies: SrdProficiency[] | undefined): {
  savingThrows: string;
  skills: string;
} {
  const savingThrows: string[] = [];
  const skills: string[] = [];

  for (const entry of proficiencies ?? []) {
    const label = entry.proficiency.name.replace(/^(Saving Throw|Skill):\s*/i, '');
    const rendered = `${label} ${formatModifier(entry.value)}`;

    if (entry.proficiency.index.startsWith('saving-throw-')) savingThrows.push(rendered);
    else if (entry.proficiency.index.startsWith('skill-')) skills.push(rendered);
  }

  return { savingThrows: savingThrows.join(', '), skills: skills.join(', ') };
}

/** Classe Armatura come sul manuale: `17 (natural armor)`, `15 (chain shirt, shield)`. */
export function formatArmorClass(armorClass: Array<{ type: string; value: number; armor?: SrdRef[] }> | undefined): string {
  const first = armorClass?.[0];
  if (!first) return '10';

  const armorNames = formatRefList(first.armor);
  if (armorNames) return `${first.value} (${armorNames})`;

  // "dex" significa solo Destrezza: sul manuale non si annota.
  if (first.type === 'dex' || first.type === 'natural armor') return String(first.value);
  if (first.type === 'natural') return `${first.value} (natural armor)`;

  return `${first.value} (${first.type})`;
}

/** Punti ferita come sul manuale: `135 (18d10 + 36)`. */
export function formatHitPoints(hitPoints: number, roll: string | undefined): string {
  if (!roll) return String(hitPoints);
  const spaced = roll.replace(/([+-])/g, ' $1 ');
  return `${hitPoints} (${spaced})`;
}

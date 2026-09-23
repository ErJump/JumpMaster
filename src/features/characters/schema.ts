import { z } from 'zod';
import { ABILITIES } from '@/core/rules';
import { SKILLS } from '@/core/rules';

export const dispositions = ['friendly', 'neutral', 'hostile', 'unknown'] as const;

export const DISPOSITION_LABELS: Record<(typeof dispositions)[number], string> = {
  friendly: 'Amichevole',
  neutral: 'Neutrale',
  hostile: 'Ostile',
  unknown: 'Da scoprire',
};

const abilityScore = z.coerce
  .number()
  .int('I punteggi di caratteristica sono numeri interi.')
  .min(1, 'Il punteggio minimo è 1.')
  .max(30, 'Il punteggio massimo è 30.');

/** Accetta sia un array già pronto sia i valori multipli di una checkbox in un form. */
function stringList(allowed: readonly string[]) {
  return z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      const list = value === undefined ? [] : Array.isArray(value) ? value : [value];
      return list.filter((entry) => allowed.includes(entry));
    });
}

export const pcSchema = z.object({
  kind: z.literal('pc'),
  name: z.string().trim().min(1, 'Dai un nome al personaggio.').max(120, 'Nome troppo lungo.'),
  playerName: z.string().trim().max(120).default(''),
  className: z.string().trim().max(60).default(''),
  subclass: z.string().trim().max(60).default(''),
  race: z.string().trim().max(60).default(''),
  level: z.coerce.number().int().min(1, 'Il livello minimo è 1.').max(20, 'Il livello massimo è 20.').default(1),
  ac: z.coerce.number().int().min(1, 'La Classe Armatura minima è 1.').max(40).default(10),
  maxHp: z.coerce.number().int().min(1, 'I punti ferita devono essere almeno 1.').max(999).default(1),
  speed: z.coerce.number().int().min(0).max(999).default(30),
  str: abilityScore.default(10),
  dex: abilityScore.default(10),
  con: abilityScore.default(10),
  int: abilityScore.default(10),
  wis: abilityScore.default(10),
  cha: abilityScore.default(10),
  saveProficiencies: stringList(ABILITIES),
  skillProficiencies: stringList(SKILLS),
  skillExpertise: stringList(SKILLS),
  notes: z.string().trim().max(20000).default(''),
});

export const npcSchema = z.object({
  kind: z.literal('npc'),
  name: z.string().trim().min(1, 'Dai un nome al personaggio.').max(120, 'Nome troppo lungo.'),
  role: z.string().trim().max(160).default(''),
  location: z.string().trim().max(160).default(''),
  disposition: z.enum(dispositions).default('unknown'),
  appearance: z.string().trim().max(2000).default(''),
  voice: z.string().trim().max(2000).default(''),
  secret: z.string().trim().max(5000).default(''),
  srdMonsterSlug: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  notes: z.string().trim().max(20000).default(''),
});

export type PcInput = z.infer<typeof pcSchema>;
export type NpcInput = z.infer<typeof npcSchema>;

export function parseCharacterForm(formData: FormData) {
  const kind = formData.get('kind');

  if (kind === 'npc') {
    return npcSchema.safeParse({
      kind: 'npc',
      name: formData.get('name') ?? '',
      role: formData.get('role') ?? '',
      location: formData.get('location') ?? '',
      disposition: formData.get('disposition') ?? 'unknown',
      appearance: formData.get('appearance') ?? '',
      voice: formData.get('voice') ?? '',
      secret: formData.get('secret') ?? '',
      srdMonsterSlug: formData.get('srdMonsterSlug') ?? '',
      notes: formData.get('notes') ?? '',
    });
  }

  return pcSchema.safeParse({
    kind: 'pc',
    name: formData.get('name') ?? '',
    playerName: formData.get('playerName') ?? '',
    className: formData.get('className') ?? '',
    subclass: formData.get('subclass') ?? '',
    race: formData.get('race') ?? '',
    level: formData.get('level') ?? 1,
    ac: formData.get('ac') ?? 10,
    maxHp: formData.get('maxHp') ?? 1,
    speed: formData.get('speed') ?? 30,
    str: formData.get('str') ?? 10,
    dex: formData.get('dex') ?? 10,
    con: formData.get('con') ?? 10,
    int: formData.get('int') ?? 10,
    wis: formData.get('wis') ?? 10,
    cha: formData.get('cha') ?? 10,
    saveProficiencies: formData.getAll('saveProficiencies').map(String),
    skillProficiencies: formData.getAll('skillProficiencies').map(String),
    skillExpertise: formData.getAll('skillExpertise').map(String),
    notes: formData.get('notes') ?? '',
  });
}

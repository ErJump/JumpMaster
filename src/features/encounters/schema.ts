import { z } from 'zod';

export const encounterMetaSchema = z.object({
  name: z.string().trim().min(1, 'Dai un nome allo scontro.').max(120, 'Nome troppo lungo.'),
  description: z.string().trim().max(5000).default(''),
  notes: z.string().trim().max(20000).default(''),
});

/**
 * Dal client arrivano **solo** l'identificativo del mostro e la quantità.
 *
 * PE, punti ferita e Classe Armatura li rilegge il server dall'SRD: un numero che arriva
 * dal browser non è un dato di cui fidarsi, anche in un'app locale.
 */
export const encounterMonstersSchema = z
  .array(
    z.object({
      slug: z.string().trim().min(1).max(120),
      count: z.coerce.number().int().min(1, 'Almeno un mostro.').max(50, 'Al massimo 50 copie dello stesso mostro.'),
    }),
  )
  .max(40, 'Troppi tipi di mostro in un solo scontro.');

export type EncounterMonsterInput = z.infer<typeof encounterMonstersSchema>[number];

export const ENCOUNTER_STATUS_LABELS = {
  planned: 'Preparato',
  running: 'In corso',
  done: 'Concluso',
} as const;

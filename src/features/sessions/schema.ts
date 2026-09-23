import { z } from 'zod';
import { emptyPrep, type SessionPrep } from '@/core/sessions';

const item = z.object({ id: z.string().min(1).max(64), text: z.string().max(4000) });
const secret = item.extend({ revealed: z.boolean() });
const list = z.array(item).max(60, 'Troppe voci in un solo passo.');

export const sessionPrepSchema = z.object({
  characters: z.string().max(20000),
  strongStart: z.string().max(20000),
  scenes: list,
  secrets: z.array(secret).max(100, 'Troppi segreti in una sola sessione.'),
  locations: list,
  npcs: list,
  monsters: list,
  rewards: list,
});

/**
 * Legge la preparazione salvata. Ciò che manca o non torna si riempie coi valori vuoti invece di
 * rompere la pagina: una preparazione a metà è normalissima.
 */
export function readPrep(raw: unknown): SessionPrep {
  const parsed = sessionPrepSchema.partial().safeParse(raw);
  return { ...emptyPrep(), ...(parsed.success ? parsed.data : {}) };
}

export const sessionMetaSchema = z.object({
  title: z.string().trim().max(160, 'Titolo troppo lungo.').default(''),
  playedOn: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Data non valida.')
    .transform((value) => (value === '' ? null : value)),
});

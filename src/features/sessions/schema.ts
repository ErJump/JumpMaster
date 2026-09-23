import { z } from 'zod';
import { emptyPrep, type SessionPrep } from '@/core/sessions';
import { sessionPrepSchema } from '@/db/schema/json';

export { sessionPrepSchema };

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

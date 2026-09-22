/**
 * Validazione al confine (AGENTS.md §8): ogni input che arriva da un form passa da qui.
 * I messaggi sono in italiano perché li legge il DM, non lo sviluppatore (SPEC-0002 AC9).
 */
import { z } from 'zod';

export const campaignStatuses = ['active', 'paused', 'completed'] as const;

export const CAMPAIGN_STATUS_LABELS: Record<(typeof campaignStatuses)[number], string> = {
  active: 'In corso',
  paused: 'In pausa',
  completed: 'Conclusa',
};

export const campaignInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Dai un nome alla campagna.')
    .max(120, 'Il nome è troppo lungo: massimo 120 caratteri.'),
  description: z.string().trim().max(5000, 'La premessa è troppo lunga.').default(''),
  setting: z.string().trim().max(200, "Il nome dell'ambientazione è troppo lungo.").default(''),
  dmNotes: z.string().trim().max(20000, 'Gli appunti sono troppo lunghi.').default(''),
  partyLevel: z.coerce
    .number()
    .int('Il livello deve essere un numero intero.')
    .min(1, 'Il livello minimo è 1.')
    .max(20, 'Il livello massimo è 20.')
    .default(1),
  sessionCount: z.coerce
    .number()
    .int()
    .min(0, 'Le sessioni giocate non possono essere negative.')
    .default(0),
  status: z.enum(campaignStatuses).default('active'),
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;

/** Legge un `FormData` con lo schema, restituendo i campi in errore invece di lanciare. */
export function parseCampaignForm(formData: FormData) {
  return campaignInputSchema.safeParse({
    name: formData.get('name') ?? '',
    description: formData.get('description') ?? '',
    setting: formData.get('setting') ?? '',
    dmNotes: formData.get('dmNotes') ?? '',
    partyLevel: formData.get('partyLevel') ?? 1,
    sessionCount: formData.get('sessionCount') ?? 0,
    status: formData.get('status') ?? 'active',
  });
}

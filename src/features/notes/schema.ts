import { z } from 'zod';

export const noteKinds = ['place', 'faction', 'plot', 'lore', 'other'] as const;

export const NOTE_KIND_INFO: Record<(typeof noteKinds)[number], { label: string; icon: string }> = {
  place: { label: 'Luogo', icon: '🏰' },
  faction: { label: 'Fazione', icon: '⚜️' },
  plot: { label: 'Trama', icon: '🧵' },
  lore: { label: 'Conoscenza', icon: '📖' },
  other: { label: 'Altro', icon: '✦' },
};

export const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Dai un titolo alla nota.')
    .max(160, 'Titolo troppo lungo.')
    // Le parentesi quadre spezzerebbero la sintassi dei collegamenti.
    .refine((title) => !/[\[\]|]/.test(title), 'Il titolo non può contenere [ ] o |.'),
  kind: z.enum(noteKinds).default('other'),
  body: z.string().max(100_000, 'Testo troppo lungo.').default(''),
});

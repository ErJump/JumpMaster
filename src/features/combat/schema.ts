/**
 * Validazione degli eventi che arrivano dal browser.
 *
 * Il client **non** può aggiungere combattenti né avviare il combattimento: quegli eventi li
 * scrive solo il server in `startCombat`, con i numeri riletti dall'SRD. Dal browser arrivano
 * soltanto le azioni del DM durante la partita.
 */
import { z } from 'zod';

const id = z.string().min(1).max(80);
const amount = z.coerce.number().int().min(1, 'Serve un numero maggiore di zero.').max(9999, 'Numero troppo grande.');

export const clientCombatEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('initiative-set'), id, value: z.coerce.number().int().min(-10).max(99) }),
  z.object({ type: z.literal('damage'), id, amount, critical: z.boolean().optional(), source: z.string().max(120).optional() }),
  z.object({ type: z.literal('heal'), id, amount }),
  z.object({ type: z.literal('temp-hp'), id, amount }),
  z.object({ type: z.literal('condition-add'), id, condition: z.string().min(1).max(40) }),
  z.object({ type: z.literal('condition-remove'), id, condition: z.string().min(1).max(40) }),
  z.object({ type: z.literal('concentration-set'), id, spell: z.string().trim().min(1, 'Su quale incantesimo?').max(80) }),
  z.object({ type: z.literal('concentration-break'), id }),
  z.object({ type: z.literal('concentration-kept'), id }),
  z.object({
    type: z.literal('death-save'),
    id,
    result: z.enum(['success', 'failure', 'critical-success', 'critical-failure']),
  }),
  z.object({ type: z.literal('death-save-reset'), id }),
  z.object({ type: z.literal('turn-next') }),
  z.object({ type: z.literal('turn-prev') }),
  z.object({ type: z.literal('combatant-remove'), id }),
  z.object({ type: z.literal('visibility-set'), id, hidden: z.boolean() }),
  z.object({ type: z.literal('note'), text: z.string().trim().min(1).max(500) }),
]);

export type ClientCombatEvent = z.infer<typeof clientCombatEventSchema>;

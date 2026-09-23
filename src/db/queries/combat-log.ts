/**
 * Lettura del registro di un combattimento.
 *
 * Sta nel livello dati condiviso, non nella slice `combat`, perché la usano due slice: il combat
 * tracker e la Vista Giocatori. L'invariante I2 vieta a una slice di importarne un'altra; una
 * lettura su una tabella condivisa appartiene al livello dati. Vedi `docs/memory/architecture.md`.
 */
import 'server-only';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../client';
import { combatEvents, encounters } from '../schema';
import { reduceCombat, type CombatEvent, type CombatState } from '@/core/events';

export interface StoredCombatEvent {
  event: CombatEvent;
  /**
   * Gli eventi scritti all'avvio — l'inizio e l'ingresso dei combattenti — non si annullano:
   * annullandoli sparirebbero i combattenti stessi, che non è mai ciò che il DM intende.
   */
  setup: boolean;
}

/** Gli eventi attivi, nell'ordine in cui sono avvenuti. Gli annullati restano fuori. */
export function loadCombatEvents(encounterId: number): StoredCombatEvent[] {
  return db
    .select({ payload: combatEvents.payload })
    .from(combatEvents)
    .where(and(eq(combatEvents.encounterId, encounterId), isNull(combatEvents.undoneAt)))
    .orderBy(asc(combatEvents.seq))
    .all()
    .map(({ payload }) => {
      const { setup, ...event } = payload as CombatEvent & { setup?: boolean };
      return { event: event as CombatEvent, setup: setup === true };
    });
}

/**
 * Stato del combattimento in corso nella campagna, se c'è. Serve alla Vista Giocatori e alle mappe
 * (segnalini dei morti, di chi è il turno, dei nascosti).
 */
export function runningCombat(campaignId: number): { encounterId: number; state: CombatState } | null {
  const running = db
    .select({ id: encounters.id })
    .from(encounters)
    .where(and(eq(encounters.campaignId, campaignId), eq(encounters.status, 'running')))
    .get();
  if (!running) return null;
  return { encounterId: running.id, state: reduceCombat(loadCombatEvents(running.id).map(({ event }) => event)) };
}

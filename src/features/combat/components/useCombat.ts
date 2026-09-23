'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { reduceCombat, type CombatEvent } from '@/core/events';
import { appendCombatEvent, undoCombatEvent } from '../actions';
import type { ClientCombatEvent } from '../schema';

interface Entry {
  event: CombatEvent;
  setup: boolean;
}

/**
 * Stato del combattimento **lato browser**, con persistenza in sottofondo.
 *
 * Il riduttore è puro (ADR-0005), quindi gira anche qui: ogni azione del DM si applica
 * all'istante e al tavolo non si percepisce alcuna attesa. Il salvataggio segue in una
 * **coda ordinata**, così il database riceve gli eventi nello stesso ordine in cui il DM li ha
 * fatti. Alla ricarica della pagina il server ricostruisce lo stato dal database, che resta
 * la fonte di verità.
 */
export function useCombat(encounterId: number, initial: Entry[]) {
  const [entries, setEntries] = useState<Entry[]>(initial);
  const [syncError, setSyncError] = useState<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const state = useMemo(() => reduceCombat(entries.map((entry) => entry.event)), [entries]);

  const persist = useCallback((task: () => Promise<{ error?: string }>) => {
    queue.current = queue.current
      .then(task)
      .then((result) => {
        if (result.error) setSyncError(result.error);
      })
      .catch(() => setSyncError('Salvataggio non riuscito. Ricarica la pagina per risincronizzare.'));
  }, []);

  const dispatch = useCallback(
    (event: ClientCombatEvent) => {
      setEntries((previous) => [...previous, { event, setup: false }]);
      persist(() => appendCombatEvent(encounterId, event));
    },
    [encounterId, persist],
  );

  // Si annulla solo ciò che ha fatto il DM: la preparazione iniziale resta.
  const canUndo = entries.length > 0 && entries[entries.length - 1]?.setup === false;

  const undo = useCallback(() => {
    // La decisione va presa sugli stessi dati per stato locale e database: se qui non c'è
    // nulla da annullare, non si chiede nulla al server.
    const last = entries[entries.length - 1];
    if (!last || last.setup) return;
    setEntries(entries.slice(0, -1));
    persist(() => undoCombatEvent(encounterId));
  }, [entries, encounterId, persist]);

  const lastAction = [...entries].reverse().find((entry) => !entry.setup)?.event;

  return { state, dispatch, undo, canUndo, lastAction, syncError };
}

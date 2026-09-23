'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export const AUTOSAVE_LABEL: Record<AutosaveStatus, string> = {
  idle: '',
  pending: 'Modifiche in attesa…',
  saving: 'Salvo…',
  saved: 'Salvato',
  error: 'Salvataggio non riuscito',
};

/**
 * Salvataggio automatico con un breve ritardo: ogni tasto premuto non deve diventare una
 * scrittura, ma nessuna modifica deve andare persa.
 *
 * - I salvataggi passano in una **coda**, così arrivano nell'ordine in cui sono stati fatti.
 * - Se il componente sparisce (si cambia pagina) prima della scadenza, **salva subito**.
 * - Se si chiude la finestra con modifiche in attesa, il browser **chiede conferma**.
 */
export function useAutosave<T>(save: (value: T) => Promise<{ error?: string }>, delay = 700) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<{ value: T } | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    queue.current = queue.current
      .then(async () => {
        setStatus('saving');
        const result = await saveRef.current(next.value);
        setError(result.error ?? null);
        setStatus(result.error ? 'error' : pending.current ? 'pending' : 'saved');
      })
      .catch(() => {
        setError('Salvataggio non riuscito.');
        setStatus('error');
      });
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pending.current = { value };
      setStatus('pending');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      flush(); // cambio di pagina: ciò che era in attesa si salva adesso
    };
  }, [flush]);

  return { status, error, schedule, flush };
}

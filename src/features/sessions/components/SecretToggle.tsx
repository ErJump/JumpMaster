'use client';

import { useOptimistic, useTransition } from 'react';

/**
 * Spunta di un segreto nella vista «al tavolo»: il DM la usa a metà partita, quindi deve
 * rispondere all'istante — lo stato si aggiorna subito e il salvataggio segue.
 */
export function SecretToggle({
  revealed,
  onToggle,
  children,
}: {
  revealed: boolean;
  onToggle: (revealed: boolean) => Promise<void>;
  children: React.ReactNode;
}) {
  const [optimistic, setOptimistic] = useOptimistic(revealed);
  const [, startTransition] = useTransition();

  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xs px-2 py-1.5 transition-colors hover:bg-[var(--jm-surface-raised)] ${optimistic ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={optimistic}
        onChange={(event) => {
          const next = event.target.checked;
          startTransition(async () => {
            setOptimistic(next);
            await onToggle(next);
          });
        }}
        className="mt-1 h-5 w-5 shrink-0 accent-[var(--jm-bottle)]"
      />
      <span className={`text-ink text-base leading-relaxed ${optimistic ? 'line-through' : ''}`}>{children}</span>
    </label>
  );
}

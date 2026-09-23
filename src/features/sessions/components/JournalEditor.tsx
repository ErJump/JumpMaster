'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/ui/components/Button';
import { useAutosave, AUTOSAVE_LABEL } from '@/ui/hooks/useAutosave';

export function JournalEditor({
  initial,
  save,
  draft,
}: {
  initial: string;
  save: (journal: string) => Promise<{ error?: string }>;
  draft: () => Promise<{ draft: string | null; message: string }>;
}) {
  const [text, setText] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const { status, error, schedule } = useAutosave(save);

  function change(next: string) {
    setText(next);
    schedule(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          disabled={loading}
          onClick={() =>
            startLoading(async () => {
              const result = await draft();
              setNotice(result.message);
              // La bozza si AGGIUNGE in fondo: non sovrascrive mai ciò che il DM ha già scritto.
              if (result.draft) change(text.trim() ? `${text.trimEnd()}\n\n${result.draft}` : result.draft);
            })
          }
        >
          {loading ? 'Leggo il registro…' : '⚔ Bozza dal registro dei combattimenti'}
        </Button>
        {notice && <span className="text-ink-soft text-base">{notice}</span>}
        <span className="text-ink-faint ml-auto text-sm" aria-live="polite">
          {error ?? AUTOSAVE_LABEL[status]}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(event) => change(event.target.value)}
        rows={22}
        placeholder={'Cosa è successo? Chi hanno incontrato, cosa hanno promesso, cosa è rimasto in sospeso.\n\nScrivi [[Nome]] per collegare note e personaggi.'}
        className="panel text-ink placeholder:text-ink-faint w-full px-4 py-3 font-mono text-base leading-relaxed outline-none focus:border-[var(--jm-gold-soft)]"
      />
    </div>
  );
}

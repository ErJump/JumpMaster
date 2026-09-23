'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/ui/components/Button';

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; fileName: string }
  | { kind: 'done'; id: number; name: string }
  | { kind: 'error'; message: string };

/** Il file va alla route così com'è: niente lettura nel browser, anche se pesa decine di MB. */
export function ImportArchive() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function upload(file: File) {
    setStatus({ kind: 'working', fileName: file.name });
    try {
      const response = await fetch('/api/archivio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: file,
      });
      const result = (await response.json()) as { ok: true; id: number; name: string } | { ok: false; error: string };
      if (result.ok) {
        setStatus({ kind: 'done', id: result.id, name: result.name });
        router.refresh();
      } else {
        setStatus({ kind: 'error', message: result.error });
      }
    } catch {
      setStatus({ kind: 'error', message: 'Importazione non riuscita: il server non ha risposto.' });
    } finally {
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        aria-label="File della campagna"
        disabled={status.kind === 'working'}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        className="text-ink-soft file:border-border-strong file:text-ink file:bg-surface-raised block w-full text-base file:mr-3 file:rounded-xs file:border file:px-3 file:py-1.5"
      />
      <div aria-live="polite" className="text-base">
        {status.kind === 'working' && <p className="text-ink-soft">Importo «{status.fileName}»…</p>}
        {status.kind === 'error' && (
          <p role="alert" className="text-wax">
            {status.message}
          </p>
        )}
        {status.kind === 'done' && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-bottle">✓ Importata come «{status.name}».</p>
            <Link href={`/campagne/${status.id}`} className="text-gold underline">
              Apri la campagna
            </Link>
            <Button variant="ghost" className="px-3 py-1" onClick={() => setStatus({ kind: 'idle' })}>
              Importane un’altra
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

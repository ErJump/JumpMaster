'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Button } from '@/ui/components/Button';

export type SaveResult = { id?: number; error?: string };

/** Monete SRD in italiano: gp → mo, sp → ma, cp → mr. */
const COIN: Record<string, string> = { gp: 'mo', sp: 'ma', cp: 'mr', ep: 'me', pp: 'mp' };
export const price = (value: number | null, unit: string | null) =>
  value === null ? '—' : `${value} ${unit ? (COIN[unit] ?? unit) : ''}`.trim();

/** Riquadro per ciò che è riservato al DM (SPEC-0011 AC10). */
export function DmOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="panel border-l-wax mt-3 border-l-4 px-4 py-2">
      <p className="small-caps text-wax text-sm font-semibold">⚠️ {label} — solo per te</p>
      <div className="text-ink text-base leading-relaxed">{children}</div>
    </div>
  );
}

export function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-ink text-base leading-relaxed">
      <span className="small-caps text-gold font-semibold">{label}</span> {children}
    </p>
  );
}

/**
 * «Rigenera» e il salvataggio nella campagna. Dopo il salvataggio compare il collegamento a ciò
 * che è stato creato, così il DM può aprirlo subito.
 */
export function ResultActions({
  onRegenerate,
  save,
  saveLabel,
  openHref,
}: {
  onRegenerate: () => void;
  save?: () => Promise<SaveResult>;
  saveLabel: string;
  openHref: (id: number) => string;
}) {
  const [saved, setSaved] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startSaving] = useTransition();

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <Button
        variant="ghost"
        onClick={() => {
          setSaved(null);
          setError(null);
          onRegenerate();
        }}
      >
        🎲 Rigenera
      </Button>
      {save ? (
        saved === null ? (
          <Button
            disabled={pending}
            onClick={() =>
              startSaving(async () => {
                const result = await save();
                if (result.error || result.id === undefined) setError(result.error ?? 'Salvataggio non riuscito.');
                else setSaved(result.id);
              })
            }
          >
            {pending ? 'Salvo…' : saveLabel}
          </Button>
        ) : (
          <Link href={openHref(saved)} className="text-bottle text-base underline underline-offset-2">
            ✓ Salvato — apri
          </Link>
        )
      ) : (
        <span className="text-ink-faint text-sm">Scegli una campagna attiva per salvare.</span>
      )}
      {error && <span role="alert" className="text-wax text-base">{error}</span>}
    </div>
  );
}

export function StartButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Button onClick={onClick} className="px-6 text-lg">🎲 {label}</Button>
    </div>
  );
}

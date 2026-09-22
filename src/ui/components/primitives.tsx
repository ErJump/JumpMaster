/**
 * Primitive del design system fantasy.
 *
 * Vincolo trasversale (AGENTS.md §6): lo schermo finisce condiviso su Discord, dove la
 * compressione video distrugge il testo sottile. Qui dentro niente corpo sotto 16px,
 * niente pesi light su fondo decorato, contrasto sempre ≥ 4.5:1.
 */
import type { ReactNode } from 'react';

/* ── Pannello ─────────────────────────────────────────────────────── */

export function Panel({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return <Tag className={`panel ${className}`}>{children}</Tag>;
}

/* ── Intestazione di pagina ───────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  count,
  actions,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-gold text-4xl">{title}</h1>
          {count !== undefined && (
            <span className="text-ink-faint font-mono text-base tabular-nums">{count}</span>
          )}
        </div>
        {actions}
      </div>
      <hr className="rule-gold mt-3" />
      {subtitle && <p className="text-ink-soft mt-3 text-lg">{subtitle}</p>}
    </header>
  );
}

/* ── Etichette ────────────────────────────────────────────────────── */

const BADGE_TONES = {
  neutral: 'border-border-strong text-ink-soft',
  gold: 'border-gold/50 text-gold',
  wax: 'border-wax/50 text-wax',
  bottle: 'border-bottle/50 text-bottle',
  arcane: 'border-arcane/50 text-arcane',
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  children,
  tone = 'neutral',
  title,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`small-caps inline-flex items-center rounded-xs border px-2 py-0.5 text-sm ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── Stato vuoto ──────────────────────────────────────────────────── */

/**
 * Uno stato vuoto non è una pagina bianca: dice cosa manca e cosa fare (SPEC-0002 AC7).
 * Per un DM alle prime armi è la differenza fra "è rotto" e "ho capito".
 */
export function EmptyState({
  icon = '✦',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-8 py-16 text-center">
      <span aria-hidden className="text-gold-soft text-5xl">
        {icon}
      </span>
      <h2 className="text-ink text-2xl">{title}</h2>
      <p className="text-ink-soft max-w-prose text-lg">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ── Riga di dettaglio ────────────────────────────────────────────── */

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="text-ink leading-relaxed">
      <span className="small-caps text-gold font-semibold">{label}</span> {children}
    </p>
  );
}

/* ── Attribuzione SRD ─────────────────────────────────────────────── */

/**
 * Richiesta dalla licenza CC-BY-4.0 e dal file NOTICE: deve restare visibile
 * nell'app, non solo nel repository (AGENTS.md §5).
 */
export function SrdAttribution({ className = '' }: { className?: string }) {
  return (
    <p className={`text-ink-faint text-sm leading-relaxed ${className}`}>
      Contenuto di gioco dal{' '}
      <a
        href="https://dnd.wizards.com/resources/systems-reference-document"
        target="_blank"
        rel="noreferrer"
        className="decoration-gold-soft underline underline-offset-2"
      >
        System Reference Document 5.1
      </a>{' '}
      di Wizards of the Coast LLC, sotto licenza{' '}
      <a
        href="https://creativecommons.org/licenses/by/4.0/legalcode.it"
        target="_blank"
        rel="noreferrer"
        className="decoration-gold-soft underline underline-offset-2"
      >
        CC-BY-4.0
      </a>
      . Progetto amatoriale, non ufficiale.
    </p>
  );
}

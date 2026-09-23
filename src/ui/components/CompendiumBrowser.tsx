'use client';

import Link from 'next/link';
import { useSearchParams, useSelectedLayoutSegment } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { matchesSearch } from '@/lib/text';
import { expandQuery } from '@/lib/glossary';
import type { BadgeTone } from './primitives';

export interface BrowserItem {
  slug: string;
  name: string;
  /** Riga secondaria, es. "Large aberration · lawful evil". */
  meta?: string;
  /** Etichetta a destra, es. il grado di sfida. */
  badge?: { label: string; tone?: BadgeTone; title?: string };
  /** Valori su cui filtrano i menu a tendina. */
  facets?: Record<string, string>;
  /** Testo aggiuntivo su cui cercare, per la ricerca a pieno testo. */
  searchText?: string;
}

export interface BrowserFilter {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'border-border-strong text-ink-soft',
  gold: 'border-gold/50 text-gold',
  wax: 'border-wax/50 text-wax',
  bottle: 'border-bottle/50 text-bottle',
  arcane: 'border-arcane/50 text-arcane',
};

/**
 * Elenco ricercabile del compendio.
 *
 * La ricerca è **interamente lato client**: i metadati anche di un paio di migliaia di mostri pesano
 * poche centinaia di kilobyte, e filtrarli in memoria dà una risposta immediata, senza il viaggio al server che
 * al tavolo si sentirebbe eccome (SPEC-0003 AC18). I dati completi restano sul dettaglio,
 * caricato dal server.
 */
export function CompendiumBrowser({
  items,
  basePath,
  filters = [],
  placeholder,
}: {
  items: BrowserItem[];
  basePath: string;
  filters?: BrowserFilter[];
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  // Un filtro può arrivare dall'indirizzo (`/bestiario?source=tob2`): ci si arriva già filtrati.
  const searchParams = useSearchParams();
  const [active, setActive] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      filters.flatMap((filter) => {
        const value = searchParams.get(filter.key);
        return value && filter.options.some((option) => option.value === value) ? [[filter.key, value]] : [];
      }),
    ),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Il segmento corrente è lo slug del dettaglio aperto: serve a evidenziare la riga.
  const currentSlug = useSelectedLayoutSegment();

  // "/" porta il fuoco sulla ricerca: al tavolo si va di fretta (AGENTS.md §6).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // L'interfaccia è in italiano ma i dati SRD sono in inglese: chi cerca «copertura»
  // deve trovare *Cover*. Il glossario traduce la ricerca (vedi `expandQuery`).
  const terms = useMemo(() => (query ? expandQuery(query) : []), [query]);

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (terms.length > 0) {
        const haystack = `${item.name}\n${item.meta ?? ''}\n${item.searchText ?? ''}`;
        if (!terms.some((term) => matchesSearch(haystack, term))) return false;
      }
      for (const [key, value] of Object.entries(active)) {
        if (value && item.facets?.[key] !== value) return false;
      }
      return true;
    });
  }, [items, terms, active]);

  const hasFilters = Object.values(active).some(Boolean) || query !== '';

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="panel text-ink placeholder:text-ink-faint focus:border-gold-soft w-full px-3 py-2.5 pr-8 text-base outline-none"
        />
        <kbd className="text-ink-faint pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs">
          /
        </kbd>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <select
              key={filter.key}
              aria-label={filter.label}
              value={active[filter.key] ?? ''}
              onChange={(event) =>
                setActive((previous) => ({ ...previous, [filter.key]: event.target.value }))
              }
              className="panel text-ink-soft focus:border-gold-soft cursor-pointer px-2 py-1.5 text-base outline-none"
            >
              <option value="">{filter.label}: tutti</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActive({});
              }}
              className="text-ink-faint hover:text-gold px-2 py-1.5 text-base underline underline-offset-2"
            >
              azzera
            </button>
          )}
        </div>
      )}

      <p className="text-ink-faint font-mono text-sm tabular-nums">
        {visible.length} di {items.length}
      </p>

      <ul className="panel min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 && (
          <li className="text-ink-faint px-3 py-6 text-center text-base">
            Nessun risultato per «{query}».
          </li>
        )}
        {visible.map((item) => {
          const isActive = item.slug === currentSlug;
          return (
            <li key={item.slug}>
              <Link
                href={`${basePath}/${item.slug}`}
                className={`border-border/60 flex items-center gap-3 border-b px-3 py-2.5 transition-colors ${
                  isActive ? 'bg-gold/15 text-gold' : 'text-ink hover:bg-surface-raised'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold">{item.name}</span>
                  {item.meta && (
                    <span className="text-ink-faint block truncate text-sm">{item.meta}</span>
                  )}
                </span>
                {item.badge && (
                  <span
                    title={item.badge.title}
                    className={`small-caps shrink-0 rounded-xs border px-1.5 py-0.5 font-mono text-sm ${
                      BADGE_TONES[item.badge.tone ?? 'neutral']
                    }`}
                  >
                    {item.badge.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

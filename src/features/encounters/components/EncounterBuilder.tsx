'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { evaluateEncounter } from '@/core/rules';
import { matchesSearch } from '@/lib/text';
import { saveEncounterMonsters } from '../actions';
import { DifficultyMeter } from './DifficultyMeter';
import type { CatalogMonster } from '../queries';

interface Entry {
  slug: string;
  count: number;
}

/**
 * Composizione dello scontro con stima **istantanea**.
 *
 * `evaluateEncounter` è puro e leggerissimo, quindi gira qui nel browser mentre il DM aggiunge
 * mostri (SPEC-0006 AC3). Ogni modifica si salva subito: niente pulsante «Salva» da dimenticare.
 */
export function EncounterBuilder({
  encounterId,
  initial,
  catalog,
  party,
}: {
  encounterId: number;
  initial: Entry[];
  catalog: CatalogMonster[];
  party: { level: number; size: number };
}) {
  const [entries, setEntries] = useState<Entry[]>(initial);
  const [query, setQuery] = useState('');
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const bySlug = useMemo(() => new Map(catalog.map((monster) => [monster.slug, monster])), [catalog]);

  const evaluation = useMemo(
    () =>
      evaluateEncounter(
        entries.flatMap((entry) => {
          const monster = bySlug.get(entry.slug);
          return monster ? [{ xp: monster.xp, count: entry.count }] : [];
        }),
        party,
      ),
    [entries, bySlug, party],
  );

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return catalog
      .filter((monster) => matchesSearch(monster.name, query) || matchesSearch(monster.type, query))
      .slice(0, 12);
  }, [catalog, query]);

  function commit(next: Entry[]): void {
    setEntries(next);
    setError(null);
    startSaving(async () => {
      const result = await saveEncounterMonsters(encounterId, next);
      if (result.error) setError(result.error);
    });
  }

  function add(slug: string): void {
    const existing = entries.find((entry) => entry.slug === slug);
    commit(
      existing
        ? entries.map((entry) => (entry.slug === slug ? { ...entry, count: entry.count + 1 } : entry))
        : [...entries, { slug, count: 1 }],
    );
  }

  function setCount(slug: string, count: number): void {
    commit(
      count <= 0
        ? entries.filter((entry) => entry.slug !== slug)
        : entries.map((entry) => (entry.slug === slug ? { ...entry, count: Math.min(50, count) } : entry)),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-5">
        <div>
          <label className="small-caps text-gold mb-1 block text-base font-semibold" htmlFor="monster-search">
            Aggiungi mostri
          </label>
          <input
            id="monster-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Cerca fra ${catalog.length.toLocaleString('it-IT')} mostri — «goblin», «drago», «non morto»…`}
            className="panel text-ink placeholder:text-ink-faint focus:border-gold-soft w-full px-4 py-3 text-lg outline-none"
            autoComplete="off"
          />
          {results.length > 0 && (
            <ul className="panel mt-2 max-h-80 overflow-y-auto">
              {results.map((monster) => (
                <li key={monster.slug}>
                  <button
                    type="button"
                    onClick={() => add(monster.slug)}
                    className="border-border/60 hover:bg-surface-raised flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors"
                  >
                    <span className="text-gold text-xl leading-none">+</span>
                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate font-semibold">{monster.name}</span>
                      <span className="text-ink-faint block truncate text-sm">
                        {monster.size} {monster.type}
                      </span>
                    </span>
                    <span className="text-wax font-mono text-sm">GS {monster.crLabel}</span>
                    <span className="text-ink-faint w-20 text-right font-mono text-sm tabular-nums">
                      {monster.xp.toLocaleString('it-IT')} PE
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="small-caps text-gold text-lg">Nello scontro</h2>
            <span className="text-ink-faint text-sm" aria-live="polite">
              {saving ? 'Salvo…' : error ? '' : entries.length > 0 ? 'Salvato' : ''}
            </span>
          </div>
          {error && (
            <p role="alert" className="text-wax mb-2 text-base">
              {error}
            </p>
          )}

          {entries.length === 0 ? (
            <p className="panel text-ink-faint px-4 py-10 text-center text-lg">
              Ancora nessun mostro. Cercane uno qui sopra.
            </p>
          ) : (
            <ul className="panel">
              {entries.map((entry) => {
                const monster = bySlug.get(entry.slug);
                if (!monster) return null;
                return (
                  <li key={entry.slug} className="border-border/60 flex items-center gap-3 border-b px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCount(entry.slug, entry.count - 1)}
                        aria-label={`Uno in meno: ${monster.name}`}
                        className="border-border-strong text-ink-soft hover:text-wax hover:border-wax h-8 w-8 rounded-xs border font-mono text-lg"
                      >
                        −
                      </button>
                      <span className="text-ink w-8 text-center font-mono text-xl tabular-nums">{entry.count}</span>
                      <button
                        type="button"
                        onClick={() => setCount(entry.slug, entry.count + 1)}
                        aria-label={`Uno in più: ${monster.name}`}
                        className="border-border-strong text-ink-soft hover:text-gold hover:border-gold h-8 w-8 rounded-xs border font-mono text-lg"
                      >
                        +
                      </button>
                    </div>

                    <Link href={`/bestiario/${monster.slug}`} className="hover:text-gold min-w-0 flex-1" target="_blank">
                      <span className="text-ink block truncate text-lg font-semibold">{monster.name}</span>
                      <span className="text-ink-faint block text-sm">
                        GS {monster.crLabel} · CA {monster.ac} · {monster.hp} PF
                      </span>
                    </Link>

                    <span className="text-ink-soft font-mono tabular-nums">
                      {(monster.xp * entry.count).toLocaleString('it-IT')} PE
                    </span>

                    <button
                      type="button"
                      onClick={() => setCount(entry.slug, 0)}
                      aria-label={`Togli ${monster.name}`}
                      className="text-ink-faint hover:text-wax px-1 text-lg"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <DifficultyMeter evaluation={evaluation} party={party} />
      </div>
    </div>
  );
}

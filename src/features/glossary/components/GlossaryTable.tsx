'use client';

import { useMemo, useState } from 'react';
import { matchesSearch } from '@/lib/text';
import { GLOSSARY, GLOSSARY_CATEGORY_LABELS, type GlossaryCategory, type GlossaryTerm } from '@/lib/glossary';

/**
 * Il glossario cerca in **entrambe le lingue** (SPEC-0003 AC16): chi digita "prono"
 * trova *Prone*, e viceversa. Accenti e maiuscole non contano.
 */
export function GlossaryTable() {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const matching = GLOSSARY.filter(
      (term) =>
        matchesSearch(term.en, query) ||
        matchesSearch(term.it, query) ||
        matchesSearch(term.note ?? '', query),
    );

    const byCategory = new Map<GlossaryCategory, GlossaryTerm[]>();
    for (const term of matching) {
      const bucket = byCategory.get(term.category) ?? [];
      bucket.push(term);
      byCategory.set(term.category, bucket);
    }
    return [...byCategory.entries()];
  }, [query]);

  const total = groups.reduce((sum, [, terms]) => sum + terms.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca in italiano o in inglese — «prono», «prone», «copertura»…"
          aria-label="Cerca un termine"
          autoFocus
          className="panel text-ink placeholder:text-ink-faint focus:border-gold-soft w-full px-4 py-3 text-lg outline-none"
        />
        <p className="text-ink-faint mt-2 font-mono text-sm tabular-nums">
          {total} di {GLOSSARY.length} termini
        </p>
      </div>

      {total === 0 && (
        <p className="text-ink-soft panel px-4 py-10 text-center text-lg">
          Nessun termine per «{query}».
        </p>
      )}

      {groups.map(([category, terms]) => (
        <section key={category}>
          <h2 className="small-caps text-gold border-b-gold-soft/40 mb-2 border-b pb-1 text-xl">
            {GLOSSARY_CATEGORY_LABELS[category]}
          </h2>
          <table className="w-full text-left">
            <tbody>
              {terms.map((term) => (
                <tr key={term.en} className="border-border/50 even:bg-surface-raised/30 border-b align-top">
                  <td className="text-ink w-1/3 px-3 py-2 text-base font-semibold">{term.it}</td>
                  <td className="text-ink-soft w-1/4 px-3 py-2 text-base italic">{term.en}</td>
                  <td className="text-ink-faint px-3 py-2 text-base">{term.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

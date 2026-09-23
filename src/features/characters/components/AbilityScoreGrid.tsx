'use client';

import { useState } from 'react';
import { ABILITIES, ABILITY_LABELS, abilityModifier, formatModifier, type Ability } from '@/core/rules';

/**
 * I sei punteggi, con il modificatore che si aggiorna **mentre si digita**.
 *
 * Il DM sta ricopiando da una scheda cartacea: vedere subito «18 (+4)» gli conferma di non
 * aver sbagliato casella, prima di salvare.
 */
export function AbilityScoreGrid({
  defaults,
  saveProficiencies,
}: {
  defaults: Record<Ability, number>;
  saveProficiencies: readonly string[];
}) {
  const [scores, setScores] = useState<Record<Ability, number>>(defaults);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {ABILITIES.map((ability) => {
        const modifier = abilityModifier(scores[ability]);
        return (
          <div key={ability} className="panel px-3 py-2 text-center">
            <label className="block">
              <span className="small-caps text-gold block text-base font-semibold">
                <abbr title={ABILITY_LABELS[ability].it} className="no-underline">
                  {ABILITY_LABELS[ability].short}
                </abbr>
              </span>
              <input
                type="number"
                name={ability}
                min={1}
                max={30}
                value={scores[ability]}
                onChange={(event) =>
                  setScores((previous) => ({ ...previous, [ability]: Number(event.target.value) || 0 }))
                }
                className="text-ink w-full bg-transparent text-center font-mono text-2xl tabular-nums outline-none"
              />
              <span className="text-ink-soft block font-mono text-lg tabular-nums">
                {formatModifier(modifier)}
              </span>
            </label>

            <label className="text-ink-faint mt-1 flex items-center justify-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="saveProficiencies"
                value={ability}
                defaultChecked={saveProficiencies.includes(ability)}
                className="accent-[var(--jm-gold)]"
              />
              TS
            </label>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { SKILLS, SKILL_INFO, ABILITY_LABELS, type Skill, type ProficiencyLevel } from '@/core/rules';

/**
 * Le 18 abilità con tre stati: nessuna competenza, competenza, **esperienza**.
 *
 * L'esperienza raddoppia il bonus di competenza, non lo somma due volte — è una distinzione
 * che cambia i numeri e che l'app deve permettere di registrare.
 */
export function SkillGrid({
  proficient,
  expertise,
}: {
  proficient: readonly string[];
  expertise: readonly string[];
}) {
  const [levels, setLevels] = useState<Record<string, ProficiencyLevel>>(() =>
    Object.fromEntries(
      SKILLS.map((skill) => [
        skill,
        expertise.includes(skill) ? 'expertise' : proficient.includes(skill) ? 'proficient' : 'none',
      ]),
    ),
  );

  return (
    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      {SKILLS.map((skill: Skill) => {
        const info = SKILL_INFO[skill];
        const level = levels[skill] ?? 'none';

        return (
          <div key={skill} className="border-border/40 flex items-center gap-2 border-b py-1">
            {/* Gli input nascosti sono ciò che il form invia davvero: il menu è solo il comando. */}
            {level !== 'none' && <input type="hidden" name="skillProficiencies" value={skill} />}
            {level === 'expertise' && <input type="hidden" name="skillExpertise" value={skill} />}

            <span className="text-ink min-w-0 flex-1 truncate text-base">
              {info.it}{' '}
              <span className="text-ink-faint small-caps text-sm">{ABILITY_LABELS[info.ability].short}</span>
            </span>

            <select
              aria-label={`Competenza in ${info.it}`}
              value={level}
              onChange={(event) =>
                setLevels((previous) => ({ ...previous, [skill]: event.target.value as ProficiencyLevel }))
              }
              className={`border-border-strong cursor-pointer rounded-xs border bg-transparent px-1.5 py-0.5 text-sm outline-none ${
                level === 'expertise' ? 'text-gold' : level === 'proficient' ? 'text-ink' : 'text-ink-faint'
              }`}
            >
              <option value="none">—</option>
              <option value="proficient">Competente</option>
              <option value="expertise">Esperienza</option>
            </select>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { Combatant } from '@/core/events';
import { CONDITIONS } from './conditions';

const conditionLabel = (key: string) => CONDITIONS.find((condition) => condition.key === key)?.label ?? key;

/**
 * Ordine di iniziativa.
 *
 * Il turno corrente deve leggersi **a due metri di distanza**, anche a schermo condiviso
 * (SPEC-0007 AC5): bordo dorato spesso, sfondo pieno, nome più grande.
 */
export function InitiativeList({
  combatants,
  turnIndex,
  selectedId,
  onSelect,
  onInitiative,
}: {
  combatants: Combatant[];
  turnIndex: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onInitiative: (id: string, value: number) => void;
}) {
  return (
    <ol className="space-y-1.5" aria-label="Ordine di iniziativa">
      {combatants.map((combatant, index) => {
        const isTurn = index === turnIndex;
        const isSelected = combatant.id === selectedId;
        const dead = combatant.status === 'dead';

        return (
          <li key={combatant.id}>
            <div
              className={`panel flex items-stretch gap-3 transition-colors ${
                isTurn ? 'border-l-gold bg-gold/15 border-l-[6px]' : 'border-l-4 border-l-transparent'
              } ${isSelected ? 'outline-gold-soft outline-2' : ''} ${dead ? 'opacity-45' : ''}`}
            >
              <InitiativeInput
                key={`${combatant.id}-${combatant.initiative ?? 'x'}`}
                value={combatant.initiative}
                label={combatant.name}
                onCommit={(value) => onInitiative(combatant.id, value)}
              />

              <button
                type="button"
                onClick={() => onSelect(combatant.id)}
                className="min-w-0 flex-1 py-2 pr-3 text-left"
                aria-current={isTurn ? 'step' : undefined}
              >
                <div className="flex items-baseline gap-2">
                  {isTurn && (
                    <span aria-hidden className="text-gold text-lg">
                      ▶
                    </span>
                  )}
                  <span
                    className={`truncate font-semibold ${isTurn ? 'text-gold text-xl' : 'text-ink text-lg'} ${
                      dead ? 'line-through' : ''
                    }`}
                  >
                    {combatant.name}
                  </span>
                  {combatant.kind === 'pc' && <span className="small-caps text-bottle text-sm">PG</span>}
                  <span className="text-ink-faint ml-auto shrink-0 font-mono text-sm" title="Classe Armatura">
                    🛡 {combatant.ac}
                  </span>
                </div>

                <HitPointBar combatant={combatant} />

                <div className="mt-1 flex flex-wrap gap-1">
                  {combatant.hidden && <Tag tone="arcane">🙈 nascosto</Tag>}
                  {combatant.status === 'dead' && <Tag tone="wax">💀 morto</Tag>}
                  {combatant.status === 'unconscious' && (
                    <Tag tone="wax">
                      😵 a terra · {'✓'.repeat(combatant.deathSaves.successes) || '—'} /{' '}
                      {'✗'.repeat(combatant.deathSaves.failures) || '—'}
                    </Tag>
                  )}
                  {combatant.status === 'stable' && <Tag tone="bottle">stabile</Tag>}
                  {combatant.concentration && <Tag tone="arcane">✦ {combatant.concentration.spell}</Tag>}
                  {combatant.conditions.map((condition) => (
                    <Tag key={condition}>{conditionLabel(condition)}</Tag>
                  ))}
                </div>
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function HitPointBar({ combatant }: { combatant: Combatant }) {
  const ratio = combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 0;
  const color = ratio > 0.5 ? 'bg-bottle' : ratio > 0.25 ? 'bg-gold' : 'bg-wax';

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-xs bg-[var(--jm-surface-raised)]">
        <div className={`h-full transition-all duration-300 ${color}`} style={{ width: `${Math.max(0, ratio) * 100}%` }} />
      </div>
      <span className="text-ink w-24 shrink-0 text-right font-mono text-sm tabular-nums">
        {combatant.currentHp}/{combatant.maxHp}
        {combatant.tempHp > 0 && <span className="text-arcane"> +{combatant.tempHp}</span>}
      </span>
    </div>
  );
}

function Tag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'wax' | 'bottle' | 'arcane' }) {
  const tones = {
    neutral: 'border-border-strong text-ink-soft',
    wax: 'border-wax/60 text-wax',
    bottle: 'border-bottle/60 text-bottle',
    arcane: 'border-arcane/60 text-arcane',
  };
  return <span className={`rounded-xs border px-1.5 text-sm ${tones[tone]}`}>{children}</span>;
}

/**
 * Casella dell'iniziativa: i giocatori tirano i loro dadi, il DM scrive il risultato.
 * Invio o uscita dal campo confermano.
 */
function InitiativeInput({
  value,
  label,
  onCommit,
}: {
  value: number | null;
  label: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));

  function commit() {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed) || parsed === value) return;
    onCommit(parsed);
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      value={draft}
      placeholder="—"
      aria-label={`Iniziativa di ${label}`}
      title="Iniziativa"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
      }}
      className={`w-14 shrink-0 border-r border-[var(--jm-border)] bg-transparent text-center font-mono text-2xl tabular-nums outline-none ${
        value === null ? 'text-wax placeholder:text-wax' : 'text-ink'
      }`}
    />
  );
}

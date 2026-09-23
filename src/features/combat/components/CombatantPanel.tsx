'use client';

import { useState, type RefObject } from 'react';
import type { Combatant } from '@/core/events';
import type { MonsterSource, SrdMonsterData } from '@/lib/srd-types';
import { StatBlock, type RollRequest } from '@/ui/components/StatBlock';
import { Button } from '@/ui/components/Button';
import type { ClientCombatEvent } from '../schema';
import { CONDITIONS } from './conditions';

/**
 * Il pannello del combattente selezionato. Le azioni frequenti — danno e cura — stanno in
 * alto e costano **un numero e un clic** (SPEC-0007 AC7); Invio nel campo infligge danno.
 */
export function CombatantPanel({
  combatant,
  statBlock,
  statBlockSource,
  amount,
  onAmountChange,
  amountRef,
  dispatch,
  onRoll,
}: {
  combatant: Combatant;
  statBlock?: SrdMonsterData;
  statBlockSource?: MonsterSource;
  amount: string;
  onAmountChange: (value: string) => void;
  amountRef: RefObject<HTMLInputElement | null>;
  dispatch: (event: ClientCombatEvent) => void;
  onRoll: (request: RollRequest) => void;
}) {
  const [critical, setCritical] = useState(false);
  const [spell, setSpell] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const value = Number.parseInt(amount, 10);
  const valid = Number.isFinite(value) && value > 0;
  const id = combatant.id;

  function apply(type: 'damage' | 'heal' | 'temp-hp') {
    if (!valid) return;
    dispatch(type === 'damage' ? { type, id, amount: value, critical: critical || undefined } : { type, id, amount: value });
    onAmountChange('');
    setCritical(false);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-gold text-3xl">{combatant.name}</h2>
          {/* Un'imboscata non ancora scattata: il combattente sparisce dalla Vista Giocatori
              finché il DM non lo rivela (SPEC-0008 AC9). */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'visibility-set', id, hidden: !combatant.hidden })}
            aria-pressed={combatant.hidden}
            title={combatant.hidden ? 'Rivela ai giocatori' : 'Nascondi ai giocatori'}
            className={`small-caps rounded-xs border px-2 py-0.5 text-sm transition-colors ${
              combatant.hidden
                ? 'border-arcane text-arcane bg-arcane/10'
                : 'border-border-strong text-ink-faint hover:text-ink'
            }`}
          >
            {combatant.hidden ? '🙈 nascosto ai giocatori' : '👁 visibile ai giocatori'}
          </button>
        </div>
        <p className="font-mono text-3xl tabular-nums">
          <span className={combatant.currentHp === 0 ? 'text-wax' : 'text-ink'}>{combatant.currentHp}</span>
          <span className="text-ink-faint text-xl"> / {combatant.maxHp} PF</span>
          {combatant.tempHp > 0 && <span className="text-arcane text-xl"> +{combatant.tempHp}</span>}
        </p>
      </header>

      {combatant.status === 'dead' && (
        <p className="panel border-l-wax text-ink border-l-4 px-4 py-3 text-base">
          💀 <strong>Morto.</strong> Se è stato un errore, c’è <strong>Annulla</strong>.
        </p>
      )}
      {combatant.status === 'stable' && (
        <p className="panel border-l-bottle text-ink border-l-4 px-4 py-3 text-base">
          Stabile a 0 punti ferita: non tira più salvezza contro morte. Si risveglia con 1 PF dopo
          1d4 ore, o subito con qualunque cura.
        </p>
      )}

      {/* ── Danno e cura ─────────────────────────────────────────────── */}
      <section className="panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={amountRef}
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') apply(event.shiftKey ? 'heal' : 'damage');
            }}
            placeholder="0"
            aria-label="Quantità di danno o cura"
            className="panel text-ink w-28 px-3 py-2 text-center font-mono text-2xl tabular-nums outline-none focus:border-[var(--jm-gold-soft)]"
          />
          <Button variant="danger" disabled={!valid} onClick={() => apply('damage')} title="Invio">
            Danno
          </Button>
          <Button variant="primary" disabled={!valid} onClick={() => apply('heal')} title="Maiusc + Invio">
            Cura
          </Button>
          <Button variant="ghost" disabled={!valid} onClick={() => apply('temp-hp')}>
            Temporanei
          </Button>
          <label className="text-ink-soft ml-1 flex items-center gap-1.5 text-base">
            <input
              type="checkbox"
              checked={critical}
              onChange={(event) => setCritical(event.target.checked)}
              className="accent-[var(--jm-wax)]"
            />
            colpo critico
          </label>
        </div>
        <p className="text-ink-faint mt-2 text-sm">
          <kbd className="font-mono">Invio</kbd> infligge danno · <kbd className="font-mono">Maiusc+Invio</kbd> cura ·
          i temporanei non si sommano, resta il valore più alto
          {combatant.currentHp === 0 && ' · a terra, un critico costa due fallimenti'}
        </p>
      </section>

      {/* ── Tiri salvezza contro morte ───────────────────────────────── */}
      {combatant.status === 'unconscious' && (
        <section className="panel border-l-wax border-l-4 p-4">
          <h3 className="small-caps text-wax mb-2 text-lg">Tiri salvezza contro morte</h3>
          <div className="mb-3 flex items-center gap-6 font-mono text-2xl">
            <span className="text-bottle" aria-label={`${combatant.deathSaves.successes} successi`}>
              {[0, 1, 2].map((i) => (i < combatant.deathSaves.successes ? '●' : '○')).join(' ')}
            </span>
            <span className="text-wax" aria-label={`${combatant.deathSaves.failures} fallimenti`}>
              {[0, 1, 2].map((i) => (i < combatant.deathSaves.failures ? '●' : '○')).join(' ')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => dispatch({ type: 'death-save', id, result: 'success' })}>
              Riuscito (10+)
            </Button>
            <Button variant="danger" onClick={() => dispatch({ type: 'death-save', id, result: 'failure' })}>
              Fallito
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: 'death-save', id, result: 'critical-success' })}>
              20 naturale
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: 'death-save', id, result: 'critical-failure' })}>
              1 naturale
            </Button>
          </div>
          <p className="text-ink-faint mt-2 text-sm">
            Tre successi: stabile. Tre fallimenti: morto. Il 20 naturale lo rimette in piedi con 1 PF;
            l’1 naturale vale due fallimenti.
          </p>
        </section>
      )}

      {/* ── Concentrazione ───────────────────────────────────────────── */}
      <section>
        <h3 className="small-caps text-gold mb-2 text-lg">Concentrazione</h3>
        {combatant.concentration ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-arcane text-lg">✦ {combatant.concentration.spell}</span>
            <Button variant="ghost" onClick={() => dispatch({ type: 'concentration-break', id })}>
              Interrompi
            </Button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!spell.trim()) return;
              dispatch({ type: 'concentration-set', id, spell: spell.trim() });
              setSpell('');
            }}
          >
            <input
              value={spell}
              onChange={(event) => setSpell(event.target.value)}
              placeholder="Su quale incantesimo? es. Ragnatela"
              aria-label="Incantesimo su cui si concentra"
              className="panel text-ink placeholder:text-ink-faint flex-1 px-3 py-2 text-base outline-none"
            />
            <Button type="submit" variant="ghost" disabled={!spell.trim()}>
              Concentrati
            </Button>
          </form>
        )}
      </section>

      {/* ── Condizioni ───────────────────────────────────────────────── */}
      <section>
        <h3 className="small-caps text-gold mb-2 text-lg">Condizioni</h3>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((condition) => {
            const active = combatant.conditions.includes(condition.key);
            return (
              <button
                key={condition.key}
                type="button"
                title={`${condition.en} — ${condition.note}`}
                aria-pressed={active}
                onClick={() =>
                  dispatch({ type: active ? 'condition-remove' : 'condition-add', id, condition: condition.key })
                }
                className={`rounded-xs border px-2 py-1 text-base transition-colors ${
                  active
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-border-strong text-ink-soft hover:text-ink hover:border-gold-soft'
                }`}
              >
                {condition.label}
              </button>
            );
          })}
        </div>
        {combatant.conditions.length > 0 && (
          <ul className="text-ink-soft mt-2 space-y-0.5 text-sm">
            {CONDITIONS.filter((condition) => combatant.conditions.includes(condition.key)).map((condition) => (
              <li key={condition.key}>
                <strong className="text-ink">{condition.label}:</strong> {condition.note}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Stat block con attacchi cliccabili ───────────────────────── */}
      {statBlock && <StatBlock monster={statBlock} onRoll={onRoll} source={statBlockSource} />}

      <div className="pt-2">
        {confirmRemove ? (
          <div className="flex items-center gap-3">
            <span className="text-ink-soft text-base">Tolgo {combatant.name} dal combattimento?</span>
            <Button variant="danger" onClick={() => dispatch({ type: 'combatant-remove', id })}>
              Sì, togli
            </Button>
            <Button variant="ghost" onClick={() => setConfirmRemove(false)}>
              No
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="text-ink-faint hover:text-wax text-sm underline underline-offset-2"
          >
            Togli dal combattimento
          </button>
        )}
      </div>
    </div>
  );
}

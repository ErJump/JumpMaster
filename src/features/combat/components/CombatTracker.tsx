'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { currentCombatant, type CombatEvent } from '@/core/events';
import { roll, formatRoll, criticalDamage } from '@/core/dice';
import type { SrdMonsterData } from '@/lib/srd-types';
import type { RollRequest } from '@/ui/components/StatBlock';
import { Button } from '@/ui/components/Button';
import { useCombat } from './useCombat';
import { InitiativeList } from './InitiativeList';
import { CombatantPanel } from './CombatantPanel';

const LOG_TONE = {
  neutral: 'text-ink-soft',
  damage: 'text-wax',
  heal: 'text-bottle',
  danger: 'text-wax font-semibold',
  turn: 'text-gold small-caps',
} as const;

/** Descrizione breve dell'ultima azione, per dire al DM cosa annullerà. */
function describe(event: CombatEvent | undefined): string {
  if (!event) return '';
  switch (event.type) {
    case 'damage':
      return `${event.amount} danni`;
    case 'heal':
      return `cura di ${event.amount}`;
    case 'temp-hp':
      return `${event.amount} temporanei`;
    case 'turn-next':
      return 'turno successivo';
    case 'turn-prev':
      return 'turno precedente';
    case 'initiative-set':
      return `iniziativa ${event.value}`;
    case 'condition-add':
      return `+${event.condition}`;
    case 'condition-remove':
      return `−${event.condition}`;
    case 'death-save':
      return 'tiro contro morte';
    case 'note':
      return 'tiro di dado';
    case 'visibility-set':
      return event.hidden ? 'nascosto' : 'rivelato';
    default:
      return 'ultima azione';
  }
}

export function CombatTracker({
  encounterId,
  initial,
  statBlocks,
  endAction,
}: {
  encounterId: number;
  initial: Array<{ event: CombatEvent; setup: boolean }>;
  statBlocks: Record<string, SrdMonsterData>;
  endAction: () => Promise<void>;
}) {
  const { state, dispatch, undo, canUndo, lastAction, syncError } = useCombat(encounterId, initial);
  const turn = currentCombatant(state);

  const [selectedId, setSelectedId] = useState<string | null>(turn?.id ?? null);
  const [amount, setAmount] = useState('');
  const [lastRoll, setLastRoll] = useState<string | null>(null);
  // Dopo un 20 naturale, il danno della stessa azione va tirato coi dadi raddoppiati.
  // Si ricorda chi ha fatto il critico e con cosa, così non si applica per sbaglio a un altro.
  const [critical, setCritical] = useState<{ combatantId: string; action: string } | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  // Il selezionato può sparire (tolto dal combattimento): si ripiega su chi è di turno.
  const selected = state.combatants.find((c) => c.id === selectedId) ?? turn;

  const missingInitiative = state.combatants.filter((c) => c.initiative === null);

  // Promemoria delle azioni leggendarie alla fine del turno altrui (AC15).
  const legendary = state.combatants.filter(
    (c) =>
      c.status !== 'dead' &&
      c.id !== turn?.id &&
      c.srdMonsterSlug &&
      (statBlocks[c.srdMonsterSlug]?.legendary_actions?.length ?? 0) > 0,
  );

  function nextTurn() {
    dispatch({ type: 'turn-next' });
    setSelectedId(null); // la selezione segue il turno
  }

  function prevTurn() {
    dispatch({ type: 'turn-prev' });
    setSelectedId(null);
  }

  function handleRoll(request: RollRequest) {
    if (!selected) return;
    const who = selected.name;

    const isCritDamage =
      request.kind === 'damage' && critical?.combatantId === selected.id && critical.action === request.action;

    try {
      const notation = isCritDamage ? criticalDamage(request.notation) : request.notation;
      const result = roll(notation);

      let text: string;
      if (request.kind === 'attack') {
        const crit = result.natural20 ? ' — 20 naturale, critico! Il danno raddoppierà i dadi' : '';
        const fumble = result.natural1 ? ' — 1 naturale, mancato' : '';
        text = `${who} · ${request.action}: ${result.total} per colpire${crit}${fumble} (${formatRoll(result)})`;
        setCritical(result.natural20 ? { combatantId: selected.id, action: request.action } : null);
      } else {
        const type = request.damageType ? ` ${request.damageType}` : '';
        const note = isCritDamage ? ' — critico: dadi raddoppiati, modificatore no' : '';
        text = `${who} · ${request.action}: ${result.total} danni${type}${note} (${formatRoll(result)})`;
        // Il danno appena tirato è già pronto nel campo: si seleziona il bersaglio e si preme Danno.
        setAmount(String(result.total));
        if (isCritDamage) setCritical(null);
      }

      setLastRoll(text);
      dispatch({ type: 'note', text });
    } catch {
      setLastRoll(`Non riesco a tirare «${request.notation}».`);
    }
  }

  // Scorciatoie da tastiera. `useEffectEvent` legge sempre i valori correnti senza costringere
  // l'effetto a riagganciare l'ascoltatore a ogni render.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

    // Ctrl+Z dentro un campo resta l'annulla del testo; fuori, annulla l'azione di gioco.
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !typing) {
      event.preventDefault();
      if (canUndo) undo();
      return;
    }
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === ' ' || event.key === 'n') {
      event.preventDefault();
      if (event.shiftKey) prevTurn();
      else nextTurn();
    } else if (event.key === 'p') {
      prevTurn();
    } else if (event.key === 'd') {
      event.preventDefault();
      amountRef.current?.focus();
    } else if (/^[1-9]$/.test(event.key)) {
      const combatant = state.combatants[Number(event.key) - 1];
      if (combatant) setSelectedId(combatant.id);
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* ── Barra di comando ─────────────────────────────────────────── */}
      <div className="panel flex flex-wrap items-center gap-4 px-5 py-3">
        <div>
          <p className="small-caps text-ink-faint text-sm">Round</p>
          <p className="text-gold font-mono text-4xl leading-none tabular-nums">{state.round}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="small-caps text-ink-faint text-sm">Di turno</p>
          <p className="text-ink truncate text-2xl font-semibold">{turn?.name ?? '—'}</p>
        </div>
        <Button variant="ghost" onClick={prevTurn} title="P oppure Maiusc+Spazio">
          ◀ Indietro
        </Button>
        <Button onClick={nextTurn} className="px-6 text-lg" title="Spazio">
          Turno successivo ▶
        </Button>
        <Button variant="ghost" onClick={undo} disabled={!canUndo} title="Ctrl+Z">
          ↶ Annulla{canUndo && lastAction ? ` (${describe(lastAction)})` : ''}
        </Button>
      </div>

      {syncError && (
        <p role="alert" className="panel border-l-wax text-wax border-l-4 px-4 py-2 text-base">
          {syncError}{' '}
          <button type="button" onClick={() => window.location.reload()} className="underline underline-offset-2">
            Ricarica
          </button>
        </p>
      )}

      {missingInitiative.length > 0 && (
        <p className="panel border-l-gold text-ink border-l-4 px-4 py-2 text-base">
          🎲 Manca l’iniziativa di <strong>{missingInitiative.map((c) => c.name).join(', ')}</strong>: chiedi ai
          giocatori di tirare e scrivi il risultato nella casella a sinistra del nome. I mostri l’hanno già tirata.
        </p>
      )}

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[24rem_1fr_20rem]">
        {/* ── Ordine di iniziativa ───────────────────────────────────── */}
        <div className="min-w-0">
          <InitiativeList
            combatants={state.combatants}
            turnIndex={state.turnIndex}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            onInitiative={(id, value) => dispatch({ type: 'initiative-set', id, value })}
          />
          <p className="text-ink-faint mt-3 text-sm leading-relaxed">
            <kbd className="font-mono">Spazio</kbd> turno successivo · <kbd className="font-mono">Ctrl+Z</kbd> annulla ·{' '}
            <kbd className="font-mono">D</kbd> danno · <kbd className="font-mono">1–9</kbd> seleziona
          </p>
        </div>

        {/* ── Combattente selezionato ────────────────────────────────── */}
        <div className="min-w-0">
          {selected ? (
            <CombatantPanel
              key={selected.id}
              combatant={selected}
              statBlock={selected.srdMonsterSlug ? statBlocks[selected.srdMonsterSlug] : undefined}
              amount={amount}
              onAmountChange={setAmount}
              amountRef={amountRef}
              dispatch={dispatch}
              onRoll={handleRoll}
            />
          ) : (
            <p className="panel text-ink-faint px-6 py-12 text-center text-lg">Nessun combattente.</p>
          )}
        </div>

        {/* ── Promemoria e registro ──────────────────────────────────── */}
        <aside className="min-w-0 space-y-3">
          {state.pendingConcentration.map((check) => (
            <div key={check.combatantId} className="panel border-l-arcane border-l-4 p-3">
              <p className="text-ink text-base leading-relaxed">
                <strong>{check.combatantName}</strong> deve superare un <strong>TS su Costituzione con CD {check.dc}</strong>{' '}
                o perde <em>{check.spell}</em>.
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="primary" onClick={() => dispatch({ type: 'concentration-kept', id: check.combatantId })}>
                  Riuscito
                </Button>
                <Button variant="danger" onClick={() => dispatch({ type: 'concentration-break', id: check.combatantId })}>
                  Fallito
                </Button>
              </div>
            </div>
          ))}

          {legendary.map((c) => (
            <p key={c.id} className="panel border-l-wax text-ink border-l-4 px-3 py-2 text-base">
              👑 Alla fine di questo turno <strong>{c.name}</strong> può usare un’azione leggendaria.
            </p>
          ))}

          {lastRoll && <p className="panel text-ink px-3 py-2 font-mono text-sm">🎲 {lastRoll}</p>}

          <div className="panel">
            <h2 className="small-caps text-ink-faint border-b border-[var(--jm-border)] px-3 py-2 text-sm font-semibold">
              Registro
            </h2>
            <ol className="max-h-[28rem] space-y-1 overflow-y-auto px-3 py-2">
              {[...state.log].reverse().map((entry, index) => (
                <li key={state.log.length - index} className={`text-sm leading-snug ${LOG_TONE[entry.tone]}`}>
                  {entry.text}
                </li>
              ))}
            </ol>
          </div>

          <div className="pt-2">
            {confirmEnd ? (
              <form action={endAction} className="space-y-2">
                <p className="text-ink-soft text-base">Chiudo il combattimento? Il registro resta salvato.</p>
                <div className="flex gap-2">
                  <Button type="submit" variant="danger">
                    Sì, concludi
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmEnd(false)}>
                    No
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmEnd(true)} className="w-full">
                Concludi il combattimento
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

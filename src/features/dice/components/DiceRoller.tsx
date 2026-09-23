'use client';

import { useRef, useState } from 'react';
import {
  parseDice,
  rollExpression,
  withAdvantage,
  acceptsAdvantage,
  DiceParseError,
  ADVANTAGE_LABELS,
  type AdvantageMode,
  type RollResult,
} from '@/core/dice';
import { Button } from '@/ui/components/Button';

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100] as const;
const HISTORY_LIMIT = 50;

interface HistoryEntry {
  id: number;
  notation: string;
  result: RollResult;
  secret: boolean;
  at: string;
}

/**
 * @param onPublicRoll Se presente, i tiri **non segreti** compaiono anche sulla Vista Giocatori
 *   (SPEC-0008 AC15). Lo passa il livello `app/`: la slice `dice` non conosce la slice `player`.
 */
export function DiceRoller({ onPublicRoll }: { onPublicRoll?: (text: string) => Promise<void> } = {}) {
  const [notation, setNotation] = useState('1d20');
  const [mode, setMode] = useState<AdvantageMode>('normal');
  const [secret, setSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  function performRoll(rawNotation: string): void {
    const finalNotation = withAdvantage(rawNotation, mode);

    try {
      const result = rollExpression(parseDice(finalNotation));
      setError(null);
      setHistory((previous) =>
        [
          {
            id: nextId.current++,
            notation: finalNotation,
            result,
            secret,
            at: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
          },
          ...previous,
        ].slice(0, HISTORY_LIMIT),
      );

      if (!secret && onPublicRoll) {
        const flair = result.natural20 ? ' — 20 naturale!' : result.natural1 ? ' — 1 naturale' : '';
        void onPublicRoll(`🎲 ${finalNotation} = ${result.total}${flair}`);
      }
    } catch (caught) {
      // I messaggi del parser sono già in italiano e scritti per il DM, non per lo sviluppatore.
      setError(caught instanceof DiceParseError ? caught.message : 'Non riesco a leggere questo tiro.');
    }

    // Il fuoco resta sul campo: si tira di nuovo subito (SPEC-0004 AC9).
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  const latest = history[0];
  const advantageAvailable = acceptsAdvantage(notation);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            performRoll(notation);
          }}
          className="space-y-3"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={notation}
              onChange={(event) => setNotation(event.target.value)}
              aria-label="Notazione del tiro"
              spellCheck={false}
              autoComplete="off"
              autoFocus
              className="panel text-ink placeholder:text-ink-faint focus:border-gold-soft w-full px-4 py-3 font-mono text-xl outline-none"
              placeholder="1d20+5"
            />
            <Button type="submit" className="shrink-0 px-6 text-lg">
              Tira
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-wax text-base">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {QUICK_DICE.map((faces) => (
              <button
                key={faces}
                type="button"
                onClick={() => {
                  setNotation(`1d${faces}`);
                  performRoll(`1d${faces}`);
                }}
                className="border-border-strong text-ink-soft hover:text-gold hover:border-gold-soft rounded-xs border px-3 py-2 font-mono text-base transition-colors"
              >
                d{faces}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div
              role="group"
              aria-label="Vantaggio o svantaggio"
              className={`flex ${advantageAvailable ? '' : 'opacity-40'}`}
            >
              {(['normal', 'advantage', 'disadvantage'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={!advantageAvailable}
                  aria-pressed={mode === option}
                  onClick={() => setMode(option)}
                  className={`small-caps border px-3 py-1.5 text-base transition-colors first:rounded-l-xs last:rounded-r-xs ${
                    mode === option
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-border-strong text-ink-faint hover:text-ink'
                  }`}
                >
                  {ADVANTAGE_LABELS[option]}
                </button>
              ))}
            </div>

            <label className="text-ink-soft flex cursor-pointer items-center gap-2 text-base">
              <input
                type="checkbox"
                checked={secret}
                onChange={(event) => setSecret(event.target.checked)}
                className="accent-[var(--jm-gold)]"
              />
              Tiro segreto
              <span className="text-ink-faint text-sm">
                {onPublicRoll ? '(gli altri compaiono sulla Vista Giocatori)' : '(non finirà nella Vista Giocatori)'}
              </span>
            </label>
          </div>
        </form>

        {latest ? (
          <RollDisplay entry={latest} />
        ) : (
          <div className="panel text-ink-faint px-6 py-12 text-center text-lg">
            Invio per tirare. Funziona anche <span className="font-mono">4d6kh3</span>,{' '}
            <span className="font-mono">2d20kl1</span> o <span className="font-mono">8d6/2</span>.
          </div>
        )}
      </div>

      <aside className="min-w-0">
        <h2 className="small-caps text-ink-faint mb-2 text-base font-semibold">
          Cronologia {history.length > 0 && `(${history.length})`}
        </h2>
        {history.length === 0 ? (
          <p className="panel text-ink-faint px-4 py-8 text-center text-base">Nessun tiro, per ora.</p>
        ) : (
          <ul className="panel max-h-[32rem] overflow-y-auto">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    setNotation(entry.notation);
                    performRoll(entry.notation);
                  }}
                  title="Ritira questo tiro"
                  className="border-border/60 hover:bg-surface-raised flex w-full items-center gap-3 border-b px-3 py-2 text-left transition-colors"
                >
                  <span className="text-ink-faint font-mono text-xs">{entry.at}</span>
                  <span className="text-ink-soft min-w-0 flex-1 truncate font-mono text-sm">
                    {entry.secret && <span title="Tiro segreto">🤫 </span>}
                    {entry.notation}
                  </span>
                  <span
                    className={`shrink-0 font-mono text-lg tabular-nums ${
                      entry.result.natural20 ? 'text-bottle' : entry.result.natural1 ? 'text-wax' : 'text-gold'
                    }`}
                  >
                    {entry.result.total}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function RollDisplay({ entry }: { entry: HistoryEntry }) {
  const { result } = entry;

  return (
    <div
      className={`panel border-l-4 p-6 ${
        result.natural20 ? 'border-l-bottle' : result.natural1 ? 'border-l-wax' : 'border-l-gold'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-ink-faint font-mono text-lg">{entry.notation}</span>
        <div className="flex items-baseline gap-3">
          {result.natural20 && <span className="small-caps text-bottle text-lg">20 naturale!</span>}
          {result.natural1 && <span className="small-caps text-wax text-lg">1 naturale</span>}
          <span
            className={`font-mono text-6xl leading-none tabular-nums ${
              result.natural20 ? 'text-bottle' : result.natural1 ? 'text-wax' : 'text-gold'
            }`}
          >
            {result.total}
          </span>
        </div>
      </div>

      <hr className="rule-gold my-4" />

      {/* I singoli dadi sono sempre in chiaro: è ciò che rende il tiro verificabile
          davanti al tavolo (SPEC-0004 AC2). Gli scartati si vedono barrati, non spariscono. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {result.terms.map((term, termIndex) => (
          <div key={termIndex} className="flex items-center gap-1.5">
            <span className="text-ink-faint font-mono text-sm">{term.notation}</span>
            {term.dice.map((die, dieIndex) => (
              <span
                key={dieIndex}
                title={die.kept ? `d${die.faces}` : `d${die.faces} — scartato`}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xs border px-1.5 font-mono text-lg tabular-nums ${
                  !die.kept
                    ? 'border-border text-ink-faint line-through opacity-60'
                    : die.faces === 20 && die.value === 20
                      ? 'border-bottle text-bottle bg-bottle/10'
                      : die.faces === 20 && die.value === 1
                        ? 'border-wax text-wax bg-wax/10'
                        : 'border-border-strong text-ink'
                }`}
              >
                {die.value}
              </span>
            ))}
          </div>
        ))}
        {result.expression.divisor !== 1 && (
          <span className="text-ink-faint font-mono text-lg">÷ {result.expression.divisor}</span>
        )}
      </div>
    </div>
  );
}

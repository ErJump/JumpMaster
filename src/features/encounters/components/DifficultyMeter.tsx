import Link from 'next/link';
import { DIFFICULTY_INFO, type Difficulty, type EncounterEvaluation } from '@/core/rules';

const TONE: Record<Difficulty, { text: string; bar: string; border: string }> = {
  banale: { text: 'text-ink-soft', bar: 'bg-ink-faint', border: 'border-l-border-strong' },
  facile: { text: 'text-bottle', bar: 'bg-bottle', border: 'border-l-bottle' },
  impegnativo: { text: 'text-gold', bar: 'bg-gold', border: 'border-l-gold' },
  duro: { text: 'text-arcane', bar: 'bg-arcane', border: 'border-l-arcane' },
  letale: { text: 'text-wax', bar: 'bg-wax', border: 'border-l-wax' },
};

/** Il rapporto che riempie la barra per intero: oltre è comunque «letale». */
const GAUGE_MAX = 3;
const BAND_MARKS = [0.4, 0.8, 1.4, 2.2];

const fmt = (value: number) => value.toLocaleString('it-IT');

/**
 * Il verdetto, **con tutti i passaggi del calcolo** (SPEC-0006 AC2) e la dichiarazione che è
 * una stima dell'app e non una regola ufficiale (AC4, ADR-0008).
 */
export function DifficultyMeter({
  evaluation,
  party,
}: {
  evaluation: EncounterEvaluation;
  party: { level: number; size: number };
}) {
  const { difficulty } = evaluation;
  const tone = difficulty ? TONE[difficulty] : null;

  return (
    <div className={`panel border-l-4 p-5 ${tone?.border ?? 'border-l-border-strong'}`}>
      {!evaluation.hasParty ? (
        <>
          <p className="small-caps text-ink-faint text-base">Difficoltà</p>
          <p className="text-ink mt-1 text-lg leading-relaxed">
            Per stimarla serve il gruppo di riferimento: questa campagna non ha ancora personaggi
            giocanti.
          </p>
          <Link href="/personaggi/nuovo?tipo=pc" className="text-gold mt-2 inline-block underline underline-offset-2">
            Aggiungi i PG del gruppo
          </Link>
        </>
      ) : evaluation.monsterCount === 0 ? (
        <>
          <p className="small-caps text-ink-faint text-base">Difficoltà</p>
          <p className="text-ink-soft mt-1 text-lg">Aggiungi dei mostri per vedere la stima.</p>
        </>
      ) : (
        difficulty &&
        tone && (
          <>
            <p className="small-caps text-ink-faint text-base">Difficoltà stimata</p>
            <p className={`text-4xl font-semibold ${tone.text}`} style={{ fontFamily: 'var(--font-display)' }}>
              {DIFFICULTY_INFO[difficulty].label}
            </p>
            <p className="text-ink mt-2 text-lg leading-relaxed">{DIFFICULTY_INFO[difficulty].expect}</p>

            <div className="relative mt-4 h-3 overflow-hidden rounded-xs bg-[var(--jm-surface-raised)]">
              <div
                className={`h-full transition-all duration-300 ${tone.bar}`}
                style={{ width: `${Math.min(100, (evaluation.ratio / GAUGE_MAX) * 100)}%` }}
              />
              {BAND_MARKS.map((mark) => (
                <span
                  key={mark}
                  aria-hidden
                  className="absolute top-0 h-full w-px bg-[var(--jm-bg)]"
                  style={{ left: `${(mark / GAUGE_MAX) * 100}%` }}
                />
              ))}
            </div>
          </>
        )
      )}

      <dl className="text-ink-soft mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base">
        <dt className="small-caps text-ink-faint">PE dei mostri</dt>
        <dd className="font-mono tabular-nums">
          {fmt(evaluation.totalXp)} <span className="text-ink-faint">({evaluation.monsterCount} mostri)</span>
        </dd>

        <dt className="small-caps text-ink-faint">Fattore numero</dt>
        <dd className="font-mono tabular-nums">
          × {evaluation.actionFactor.toLocaleString('it-IT')}{' '}
          <span className="text-ink-faint font-sans">— più mostri agiscono più volte per round</span>
        </dd>

        <dt className="small-caps text-ink-faint">PE effettivi</dt>
        <dd className="font-mono tabular-nums">{fmt(evaluation.effectiveXp)}</dd>

        {evaluation.hasParty && (
          <>
            <dt className="small-caps text-ink-faint">Riferimento</dt>
            <dd className="font-mono tabular-nums">
              {fmt(evaluation.benchmarkXp)}{' '}
              <span className="text-ink-faint font-sans">
                — {party.size} PG di livello {party.level}
              </span>
            </dd>

            {evaluation.monsterCount > 0 && (
              <>
                <dt className="small-caps text-ink-faint">Rapporto</dt>
                <dd className="font-mono tabular-nums">{evaluation.ratio.toLocaleString('it-IT')}</dd>
              </>
            )}
          </>
        )}
      </dl>

      <p className="text-ink-faint border-border mt-4 border-t pt-3 text-sm leading-relaxed">
        <strong className="text-ink-soft">È una stima dell’app, non una regola ufficiale.</strong> Le
        tabelle di bilanciamento della Guida del DM non fanno parte dei contenuti liberi dell’SRD,
        quindi i numeri non combaceranno con quelli del manuale. Il riferimento è un mostro di
        grado di sfida pari al livello del gruppo, che per quattro personaggi è uno scontro equo.
      </p>
    </div>
  );
}

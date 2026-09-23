import Link from 'next/link';
import { Panel, EmptyState } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { ABILITIES, ABILITY_LABELS, formatModifier } from '@/core/rules';
import type { DerivedCharacter } from '../derive';

/**
 * La pagina che il DM guarda **da lontano mentre parla**, non quella che legge da vicino.
 * Per questo la scala tipografica è maggiorata rispetto al resto dell'app (SPEC-0005 AC13).
 */
export function PartyDashboard({ party }: { party: DerivedCharacter[] }) {
  if (party.length === 0) {
    return (
      <EmptyState
        icon="🛡️"
        title="Nessun personaggio giocante"
        description="Trascrivi le schede dei tuoi giocatori una volta sola: Classe Armatura, Percezione passiva e tiri salvezza saranno sempre qui, e smetterai di chiederli a metà scena."
        action={<ButtonLink href="/personaggi/nuovo?tipo=pc">Aggiungi un personaggio</ButtonLink>}
      />
    );
  }

  // Il numero che il DM confronta con la CD di un nascondiglio: cercarlo ogni volta
  // fra sei righe fa perdere tempo, quindi lo evidenziamo (AC11).
  const bestPerception = Math.max(...party.map((character) => character.passives.perception));

  return (
    <div className="space-y-8">
      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-gold-soft small-caps text-gold border-b">
              <th className="px-4 py-3 text-lg font-semibold">Personaggio</th>
              <th className="px-4 py-3 text-lg font-semibold">CA</th>
              <th className="px-4 py-3 text-lg font-semibold">PF</th>
              <th className="px-4 py-3 text-lg font-semibold">Perc. passiva</th>
              <th className="px-4 py-3 text-lg font-semibold">Iniziativa</th>
              <th className="px-4 py-3 text-lg font-semibold">Velocità</th>
            </tr>
          </thead>
          <tbody>
            {party.map(({ row, passives, initiative }) => (
              <tr key={row.id} className="border-border/50 even:bg-surface-raised/30 border-b">
                <td className="px-4 py-3">
                  <Link href={`/personaggi/${row.id}`} className="hover:text-gold">
                    <span className="text-ink block text-xl font-semibold">{row.name}</span>
                    <span className="text-ink-faint block text-base">
                      {[row.race, row.className, `liv. ${row.level}`].filter(Boolean).join(' · ')}
                      {row.playerName && ` — ${row.playerName}`}
                    </span>
                  </Link>
                </td>
                <td className="text-ink px-4 py-3 font-mono text-2xl tabular-nums">{row.ac}</td>
                <td className="text-ink-soft px-4 py-3 font-mono text-xl tabular-nums">{row.maxHp}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-mono text-2xl tabular-nums ${
                      passives.perception === bestPerception ? 'text-gold font-bold' : 'text-ink'
                    }`}
                    title={
                      passives.perception === bestPerception
                        ? 'La Percezione passiva più alta del gruppo'
                        : undefined
                    }
                  >
                    {passives.perception}
                  </span>
                </td>
                <td className="text-ink px-4 py-3 font-mono text-xl tabular-nums">
                  {formatModifier(initiative)}
                </td>
                <td className="text-ink-soft px-4 py-3 font-mono text-lg tabular-nums">{row.speed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <section>
        <h2 className="small-caps text-gold mb-1 text-xl">Tiri salvezza</h2>
        <p className="text-ink-faint mb-3 text-base">
          Per risolvere un effetto ad area in un colpo solo, senza chiedere niente a nessuno.
          In grassetto dove sono competenti.
        </p>
        <Panel className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-gold-soft small-caps text-gold border-b">
                <th className="px-4 py-2 text-lg font-semibold">Personaggio</th>
                {ABILITIES.map((ability) => (
                  <th key={ability} className="px-4 py-2 text-center text-lg font-semibold">
                    <abbr title={ABILITY_LABELS[ability].it} className="no-underline">
                      {ABILITY_LABELS[ability].short}
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {party.map(({ row, saves }) => (
                <tr key={row.id} className="border-border/50 even:bg-surface-raised/30 border-b">
                  <td className="text-ink px-4 py-2 text-lg">{row.name}</td>
                  {ABILITIES.map((ability) => (
                    <td key={ability} className="px-4 py-2 text-center font-mono text-xl tabular-nums">
                      <span className={saves[ability].proficient ? 'text-gold font-bold' : 'text-ink-soft'}>
                        {formatModifier(saves[ability].value)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <section>
        <h2 className="small-caps text-gold mb-3 text-xl">Altri punteggi passivi</h2>
        <Panel className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-gold-soft small-caps text-gold border-b">
                <th className="px-4 py-2 text-lg font-semibold">Personaggio</th>
                <th className="px-4 py-2 text-center text-lg font-semibold">Percezione</th>
                <th className="px-4 py-2 text-center text-lg font-semibold">Indagare</th>
                <th className="px-4 py-2 text-center text-lg font-semibold">Intuizione</th>
              </tr>
            </thead>
            <tbody>
              {party.map(({ row, passives }) => (
                <tr key={row.id} className="border-border/50 even:bg-surface-raised/30 border-b">
                  <td className="text-ink px-4 py-2 text-lg">{row.name}</td>
                  <td className="text-ink px-4 py-2 text-center font-mono text-xl tabular-nums">
                    {passives.perception}
                  </td>
                  <td className="text-ink px-4 py-2 text-center font-mono text-xl tabular-nums">
                    {passives.investigation}
                  </td>
                  <td className="text-ink px-4 py-2 text-center font-mono text-xl tabular-nums">
                    {passives.insight}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>
    </div>
  );
}

import { PageHeader, Panel } from '@/ui/components/primitives';
import { DiceRoller } from '@/features/dice/components/DiceRoller';

export default function DicePage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Dadi"
        subtitle="Per i tiri scomodi da fare a mano: i PF di otto goblin, un tiro segreto, una tabella casuale. Per il resto, usa quelli veri."
      />
      <Panel className="p-6">
        <DiceRoller />
      </Panel>

      <Panel className="mt-6 p-6">
        <h2 className="small-caps text-gold mb-3 text-xl">Notazione</h2>
        <table className="w-full text-left text-base">
          <tbody className="text-ink">
            {[
              ['d20', 'un dado a venti facce'],
              ['1d20+5', 'con modificatore'],
              ['2d20kh1', 'vantaggio (tieni il più alto)'],
              ['2d20kl1', 'svantaggio (tieni il più basso)'],
              ['4d6kh3', 'tira 4d6 e tieni i 3 migliori'],
              ['4d6dl1', 'scarta il più basso'],
              ['8d6/2', 'danno dimezzato: TS riuscito contro Fireball'],
              ['2d8+1d6+3', 'più termini insieme'],
              ['d%', 'percentuale (come d100)'],
            ].map(([syntax, meaning]) => (
              <tr key={syntax} className="border-border/50 even:bg-surface-raised/30 border-b">
                <td className="text-gold w-40 px-3 py-1.5 font-mono">{syntax}</td>
                <td className="text-ink-soft px-3 py-1.5">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

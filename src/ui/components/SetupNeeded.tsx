import { Panel } from './primitives';

/**
 * Mostrato quando una tabella `srd_*` è vuota, cioè quando i dati non sono ancora
 * stati importati.
 *
 * L'alternativa sarebbe una pagina vuota che sembra un'app rotta. L'utente è un Dungeon
 * Master, non uno sviluppatore: deve leggere cosa manca e quale comando eseguire, non
 * intuirlo.
 */
export function SetupNeeded({ what }: { what: string }) {
  return (
    <Panel className="mx-auto max-w-2xl p-8 text-center">
      <span aria-hidden className="text-gold-soft mb-3 block text-5xl">
        📥
      </span>
      <h2 className="text-gold text-2xl">Manca il compendio</h2>
      <p className="text-ink-soft mx-auto mt-2 max-w-prose text-lg leading-relaxed">
        I dati dell’SRD non sono ancora stati importati, quindi {what} è vuoto. Si scaricano una
        volta sola e poi l’app funziona senza rete.
      </p>
      <pre className="panel text-gold mt-5 inline-block px-5 py-3 text-left font-mono text-base">
        npm run srd:fetch{'\n'}npm run srd:import
      </pre>
      <p className="text-ink-faint mt-3 text-sm">
        Il primo comando ha bisogno della rete; il secondo no.
      </p>
    </Panel>
  );
}

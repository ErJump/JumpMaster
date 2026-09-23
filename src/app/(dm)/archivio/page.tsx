import { PageHeader, Panel, EmptyState } from '@/ui/components/primitives';
import { ButtonLink, DownloadLink } from '@/ui/components/Button';
import { listArchiveEntries } from '@/features/archive/queries';
import { ImportArchive } from '@/features/archive/components/ImportArchive';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function ArchivePage() {
  const entries = listArchiveEntries();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Archivio"
        subtitle="Una campagna in un solo file: personaggi, note, sessioni, scontri, mappe e immagini. Tienine una copia fuori da questo PC."
      />

      <section className="space-y-4">
        <h2 className="small-caps text-gold text-lg">Esporta</h2>
        {entries.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Nessuna campagna da salvare"
            description="Quando ne avrai una, da qui la salvi in un file."
            action={<ButtonLink href="/campagne/nuova">Crea una campagna</ButtonLink>}
          />
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Panel className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-ink truncate text-xl font-semibold">{entry.name}</p>
                    <p className="text-ink-soft text-base">
                      {plural(entry.characters, 'personaggio', 'personaggi')} · {plural(entry.notes, 'nota', 'note')} ·{' '}
                      {plural(entry.sessions, 'sessione', 'sessioni')} · {plural(entry.maps, 'mappa', 'mappe')}
                    </p>
                  </div>
                  <DownloadLink href={`/api/archivio/${entry.id}`} variant="primary">
                    📦 Esporta
                  </DownloadLink>
                </Panel>
              </li>
            ))}
          </ul>
        )}
        <p className="text-ink-soft text-base">
          ⚠ Il file contiene anche i tuoi segreti: le note riservate, i segreti dei PNG, i luoghi che i
          giocatori non conoscono. Non mandarlo a loro.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="small-caps text-gold text-lg">Importa</h2>
        <Panel className="space-y-3 p-5">
          <p className="text-ink-soft text-base">
            Scegli un file esportato da JumpMaster. Diventa una campagna <strong className="text-ink">nuova</strong>:
            quelle che hai già non vengono toccate.
          </p>
          <ImportArchive />
        </Panel>
      </section>
    </div>
  );
}

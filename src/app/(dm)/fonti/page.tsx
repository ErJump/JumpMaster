import { PageHeader } from '@/ui/components/primitives';
import { installedSources } from '@/features/sources/queries';
import { removeSource } from '@/features/sources/actions';
import { SourcesManager } from '@/features/sources/components/SourcesManager';

export default function SourcesPage() {
  const installed = installedSources().map((source) => ({
    ...source,
    importedOn: source.importedAt.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
    importedAt: undefined,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Fonti aperte"
        subtitle="Altri mostri, da manuali pubblicati con licenza aperta per lo stesso regolamento. Si scaricano una volta, poi funzionano senza rete, nel bestiario, negli scontri e in combattimento."
      />
      <SourcesManager installed={installed} remove={removeSource} />
      <p className="text-ink-faint mt-12 border-t border-[var(--jm-border)] pt-6 text-sm leading-relaxed">
        I dati arrivano da{' '}
        <a href="https://open5e.com" target="_blank" rel="noreferrer" className="decoration-gold-soft underline underline-offset-2">
          Open5e
        </a>{' '}
        e restano solo su questo PC. Ogni manuale appartiene al suo editore ed è pubblicato con la licenza indicata; il
        testo completo di ogni licenza si apre dal suo nome. Ogni stat block dice da quale manuale viene.
      </p>
    </div>
  );
}

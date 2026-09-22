import { PageHeader, Panel } from '@/ui/components/primitives';
import { GlossaryTable } from '@/features/glossary/components/GlossaryTable';

export default function GlossaryPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Glossario"
        subtitle="I dati di gioco dell’SRD sono in inglese, l’app è in italiano. Qui trovi la corrispondenza, in entrambe le direzioni."
      />
      <Panel className="p-6">
        <GlossaryTable />
      </Panel>
    </div>
  );
}

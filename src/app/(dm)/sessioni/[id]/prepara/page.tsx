import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { getSession } from '@/features/sessions/queries';
import { readPrep } from '@/features/sessions/schema';
import { saveSessionPrep, updateSessionMeta } from '@/features/sessions/actions';
import { PrepEditor } from '@/features/sessions/components/PrepEditor';
import { SessionMetaForm } from '@/features/sessions/components/SessionMetaForm';

export default async function PrepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(Number(id));
  if (!session) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title={`Prepara la sessione ${session.number}`}
        subtitle="Otto passi brevi, ispirati a «Return of the Lazy Dungeon Master» di Sly Flourish: prepara ciò che serve al tavolo e lascia spazio all’improvvisazione."
        actions={<ButtonLink href={`/sessioni/${session.id}`}>Al tavolo ▶</ButtonLink>}
      />
      <Panel className="mb-6 p-5">
        <SessionMetaForm action={updateSessionMeta.bind(null, session.id)} title={session.title} playedOn={session.playedOn} />
      </Panel>
      <PrepEditor initial={readPrep(session.prep)} save={saveSessionPrep.bind(null, session.id)} />
    </div>
  );
}

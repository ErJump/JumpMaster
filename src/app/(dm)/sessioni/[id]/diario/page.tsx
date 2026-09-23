import { notFound } from 'next/navigation';
import { PageHeader } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { getSession } from '@/features/sessions/queries';
import { saveJournal, combatDraft } from '@/features/sessions/actions';
import { JournalEditor } from '@/features/sessions/components/JournalEditor';

export default async function JournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(Number(id));
  if (!session) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title={`Diario della sessione ${session.number}`}
        subtitle="Scrivilo a caldo, finché te lo ricordi. I combattimenti li riassume l’app dal registro."
        actions={<ButtonLink href={`/sessioni/${session.id}`} variant="ghost">◀ Sessione</ButtonLink>}
      />
      <JournalEditor initial={session.journal} save={saveJournal.bind(null, session.id)} draft={combatDraft.bind(null, session.id)} />
    </div>
  );
}

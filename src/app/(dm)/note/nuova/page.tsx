import { Panel } from '@/ui/components/primitives';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { NoteForm } from '@/features/notes/components/NoteForm';
import { createNote } from '@/features/notes/actions';

export default async function NewNotePage({ searchParams }: { searchParams: Promise<{ titolo?: string }> }) {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Una nota" />;
  const { titolo } = await searchParams;

  return (
    <Panel className="p-6">
      <h2 className="text-gold mb-4 text-2xl">{titolo ? `Nuova nota: ${titolo}` : 'Nuova nota'}</h2>
      <NoteForm action={createNote.bind(null, campaign.id)} defaultTitle={titolo ?? ''} submitLabel="Crea la nota" />
    </Panel>
  );
}

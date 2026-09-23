import { PageHeader, Panel } from '@/ui/components/primitives';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { createMap } from '@/features/maps/actions';
import { NewMapForm } from '@/features/maps/components/NewMapForm';

export default async function NewMapPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Una mappa" />;
  const { tipo } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Nuova mappa" subtitle="Le dimensioni dell’immagine le legge l’app; la griglia la regoli dopo." />
      <Panel className="p-6">
        <NewMapForm action={createMap.bind(null, campaign.id)} defaultKind={tipo === 'world' ? 'world' : 'battle'} />
      </Panel>
    </div>
  );
}

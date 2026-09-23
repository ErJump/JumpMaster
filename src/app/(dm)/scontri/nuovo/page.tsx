import { PageHeader, Panel } from '@/ui/components/primitives';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { EncounterMetaForm } from '@/features/encounters/components/EncounterMetaForm';
import { createEncounter } from '@/features/encounters/actions';

export default function NewEncounterPage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Uno scontro" />;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Nuovo scontro" subtitle="Dagli un nome: i mostri li scegli nel passo successivo." />
      <Panel className="p-6">
        <EncounterMetaForm action={createEncounter.bind(null, campaign.id)} submitLabel="Crea e scegli i mostri" />
      </Panel>
    </div>
  );
}

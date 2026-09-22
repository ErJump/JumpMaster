import { PageHeader, Panel } from '@/ui/components/primitives';
import { CampaignForm } from '@/features/campaigns/components/CampaignForm';
import { createCampaign } from '@/features/campaigns/actions';

export default function NewCampaignPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Nuova campagna"
        subtitle="Basta il nome. Tutto il resto lo puoi aggiungere strada facendo."
      />
      <Panel className="p-6">
        <CampaignForm action={createCampaign} submitLabel="Crea la campagna" />
      </Panel>
    </div>
  );
}

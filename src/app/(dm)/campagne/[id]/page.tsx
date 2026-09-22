import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/ui/components/primitives';
import { CampaignForm } from '@/features/campaigns/components/CampaignForm';
import { DeleteCampaignButton, ActivateButton } from '@/features/campaigns/components/CampaignActions';
import { updateCampaign } from '@/features/campaigns/actions';
import { getCampaign, getActiveCampaign } from '@/features/campaigns/queries';

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = Number(id);
  if (!Number.isInteger(campaignId)) notFound();

  const campaign = getCampaign(campaignId);
  if (!campaign) notFound();

  const active = getActiveCampaign();
  const updateThis = updateCampaign.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title={campaign.name}
        subtitle={campaign.setting || undefined}
        actions={<ActivateButton id={campaign.id} isActive={active?.id === campaign.id} />}
      />

      <Panel className="p-6">
        <CampaignForm action={updateThis} campaign={campaign} submitLabel="Salva le modifiche" />
      </Panel>

      <div className="mt-10">
        <h2 className="small-caps text-ink-faint mb-3 text-base font-semibold">Zona pericolosa</h2>
        <DeleteCampaignButton id={campaign.id} name={campaign.name} />
      </div>
    </div>
  );
}

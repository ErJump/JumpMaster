import { PageHeader } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { listParty } from '@/features/characters/queries';
import { PartyDashboard } from '@/features/characters/components/PartyDashboard';

export default function PartyPage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Il gruppo" />;

  const party = listParty(campaign.id);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Il gruppo"
        count={party.length || undefined}
        subtitle={`${campaign.name} — i numeri che ti servono durante la sessione, senza chiederli.`}
        actions={<ButtonLink href="/personaggi/nuovo?tipo=pc" variant="ghost">Aggiungi un PG</ButtonLink>}
      />
      <PartyDashboard party={party} />
    </div>
  );
}

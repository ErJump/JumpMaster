import Link from 'next/link';
import { PageHeader, Panel, EmptyState, Badge } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { listCampaigns, getActiveCampaign } from '@/features/campaigns/queries';
import { CAMPAIGN_STATUS_LABELS } from '@/features/campaigns/schema';
import { ActivateButton } from '@/features/campaigns/components/CampaignActions';

export default function CampaignsPage() {
  const campaigns = listCampaigns();
  const active = getActiveCampaign();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Campagne"
        count={campaigns.length || undefined}
        subtitle="Ogni campagna è un mondo a sé: personaggi, scontri e note restano separati."
        actions={<ButtonLink href="/campagne/nuova">Nuova campagna</ButtonLink>}
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon="🏰"
          title="Nessuna campagna, per ora"
          description="Crea la prima: le basta un nome. Potrai cambiare tutto il resto quando vuoi."
          action={<ButtonLink href="/campagne/nuova">Crea una campagna</ButtonLink>}
        />
      ) : (
        <ul className="space-y-4">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <Panel className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/campagne/${campaign.id}`} className="group">
                      <h2 className="text-gold group-hover:text-gold text-2xl">{campaign.name}</h2>
                    </Link>
                    {campaign.setting && (
                      <p className="text-ink-soft text-lg italic">{campaign.setting}</p>
                    )}
                    {campaign.description && (
                      <p className="text-ink-soft mt-2 line-clamp-2 leading-relaxed">
                        {campaign.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="gold">Livello {campaign.partyLevel}</Badge>
                      <Badge>{campaign.sessionCount} sessioni</Badge>
                      <Badge tone={campaign.status === 'active' ? 'bottle' : 'neutral'}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status]}
                      </Badge>
                    </div>
                  </div>
                  <ActivateButton id={campaign.id} isActive={active?.id === campaign.id} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

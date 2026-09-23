import Link from 'next/link';
import { PageHeader, Panel, SrdAttribution, Badge } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { InstallHint } from '@/ui/components/InstallHint';
import { featuresByGroup } from '@/features/registry';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { CAMPAIGN_STATUS_LABELS } from '@/features/campaigns/schema';

export default function HomePage() {
  const campaign = getActiveCampaign();
  const groups = featuresByGroup();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Il tavolo ti aspetta"
        subtitle="Tutto quello che ti serve per condurre la sessione, offline e a portata di clic."
      />

      {campaign ? (
        <Panel className="mb-8 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="small-caps text-ink-faint text-sm">Campagna attiva</p>
              <h2 className="text-gold text-3xl">{campaign.name}</h2>
              {campaign.setting && <p className="text-ink-soft text-lg italic">{campaign.setting}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone="gold">Livello {campaign.partyLevel}</Badge>
              <Badge>{campaign.sessionCount} sessioni</Badge>
              <Badge tone={campaign.status === 'active' ? 'bottle' : 'neutral'}>
                {CAMPAIGN_STATUS_LABELS[campaign.status]}
              </Badge>
            </div>
          </div>
          {campaign.description && (
            <p className="text-ink mt-4 leading-relaxed">{campaign.description}</p>
          )}
          <div className="mt-5">
            <ButtonLink href={`/campagne/${campaign.id}`} variant="ghost">
              Apri la campagna
            </ButtonLink>
          </div>
        </Panel>
      ) : (
        <Panel className="mb-8 p-6">
          <h2 className="text-gold text-2xl">Comincia da qui</h2>
          <p className="text-ink-soft mt-2 text-lg leading-relaxed">
            Crea la tua prima campagna: è il contenitore di personaggi, scontri e note. Il compendio
            e i dadi funzionano comunque, anche senza.
          </p>
          <div className="mt-5">
            <ButtonLink href="/campagne/nuova">Crea una campagna</ButtonLink>
          </div>
        </Panel>
      )}

      {groups.map(({ group, label, features }) => (
        <section key={group} className="mb-8">
          <h2 className="small-caps text-ink-faint mb-3 text-base font-semibold">{label}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Link
                key={feature.id}
                href={feature.href}
                className="panel hover:border-gold-soft group flex gap-4 p-5 transition-colors"
              >
                <span aria-hidden className="text-3xl leading-none">
                  {feature.icon}
                </span>
                <span className="min-w-0">
                  <span className="text-gold block text-xl font-semibold">{feature.title}</span>
                  <span className="text-ink-soft mt-1 block leading-relaxed">{feature.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <InstallHint />

      <SrdAttribution className="mt-12 border-t border-[var(--jm-border)] pt-6" />
    </div>
  );
}

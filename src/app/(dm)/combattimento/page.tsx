import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader, EmptyState } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { runningEncounter } from '@/features/combat/queries';
import { listEncounters } from '@/features/encounters/queries';

/** Se c'è un combattimento in corso ci si va dritti; altrimenti si sceglie quale avviare. */
export default function CombatIndexPage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Un combattimento" />;

  const running = runningEncounter(campaign.id);
  if (running) redirect(`/combattimento/${running.id}`);

  const ready = listEncounters(campaign.id).filter((encounter) => encounter.monsterCount > 0);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Combattimento" subtitle="Nessun combattimento in corso. Avviane uno da uno scontro preparato." />
      {ready.length === 0 ? (
        <EmptyState
          icon="⚔️"
          title="Nessuno scontro pronto"
          description="Prepara uno scontro scegliendo i mostri: da lì lo avvii con un clic, con i PG già dentro e l’iniziativa dei mostri già tirata."
          action={<ButtonLink href="/scontri/nuovo">Prepara uno scontro</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {ready.map((encounter) => (
            <li key={encounter.id}>
              <Link href={`/scontri/${encounter.id}`} className="panel hover:border-gold-soft block p-4 transition-colors">
                <span className="text-gold block text-xl font-semibold">{encounter.name}</span>
                <span className="text-ink-faint block text-base">
                  {encounter.monsterCount} mostri · {encounter.totalXp.toLocaleString('it-IT')} PE
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

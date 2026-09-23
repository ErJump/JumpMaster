import Link from 'next/link';
import { PageHeader, Badge, EmptyState } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { partyProfile } from '@/features/characters/queries';
import { listEncounters } from '@/features/encounters/queries';
import { ENCOUNTER_STATUS_LABELS } from '@/features/encounters/schema';
import { evaluateEncounter, DIFFICULTY_INFO } from '@/core/rules';

export default function EncountersPage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Uno scontro" />;

  const encounters = listEncounters(campaign.id);
  const party = partyProfile(campaign.id);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Scontri"
        count={encounters.length || undefined}
        subtitle={
          party.size > 0
            ? `${campaign.name} — stimati per ${party.size} PG di livello ${party.level}.`
            : `${campaign.name} — aggiungi i PG del gruppo per avere la stima della difficoltà.`
        }
        actions={<ButtonLink href="/scontri/nuovo">Nuovo scontro</ButtonLink>}
      />

      {encounters.length === 0 ? (
        <EmptyState
          icon="⚔️"
          title="Nessuno scontro preparato"
          description="Prepararli prima della serata ti evita di cercare mostri mentre quattro persone aspettano — e ti dice subito se rischiano di uccidere il gruppo."
          action={<ButtonLink href="/scontri/nuovo">Prepara uno scontro</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {encounters.map((encounter) => {
            // La stima dipende solo dai PE totali e dal numero di mostri, che la lista ha già:
            // un'unica voce «media» dà esattamente lo stesso risultato senza ricaricare ogni mostro.
            const evaluation = evaluateEncounter(
              encounter.monsterCount > 0
                ? [{ xp: encounter.totalXp / encounter.monsterCount, count: encounter.monsterCount }]
                : [],
              party,
            );
            return (
              <li key={encounter.id}>
                <Link href={`/scontri/${encounter.id}`} className="panel hover:border-gold-soft block p-4 transition-colors">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-gold block text-xl font-semibold">{encounter.name}</span>
                      <span className="text-ink-faint block text-base">
                        {encounter.monsterCount} mostri · {encounter.totalXp.toLocaleString('it-IT')} PE
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {evaluation.difficulty && (
                        <Badge tone={evaluation.difficulty === 'letale' ? 'wax' : evaluation.difficulty === 'duro' ? 'arcane' : 'gold'}>
                          {DIFFICULTY_INFO[evaluation.difficulty].label}
                        </Badge>
                      )}
                      <Badge tone={encounter.status === 'running' ? 'bottle' : 'neutral'}>
                        {ENCOUNTER_STATUS_LABELS[encounter.status]}
                      </Badge>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { notFound } from 'next/navigation';
import { PageHeader, EmptyState } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { getCombatEncounter, loadCombatEvents, statBlocksFor } from '@/features/combat/queries';
import { endCombat } from '@/features/combat/actions';
import { CombatTracker } from '@/features/combat/components/CombatTracker';

export default async function CombatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encounterId = Number(id);
  if (!Number.isInteger(encounterId)) notFound();

  const encounter = getCombatEncounter(encounterId);
  if (!encounter) notFound();

  if (encounter.status !== 'running') {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title={encounter.name} />
        <EmptyState
          icon="⚔️"
          title={encounter.status === 'done' ? 'Combattimento concluso' : 'Combattimento non avviato'}
          description="Torna allo scontro per avviarlo, o per rigiocarlo da capo."
          action={<ButtonLink href={`/scontri/${encounter.id}`}>Vai allo scontro</ButtonLink>}
        />
      </div>
    );
  }

  // Il database è la fonte di verità: qui si rileggono gli eventi e il browser li riduce.
  const events = loadCombatEvents(encounterId);
  const slugs = events.flatMap(({ event }) =>
    event.type === 'combatant-add' && event.srdMonsterSlug ? [event.srdMonsterSlug] : [],
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <h1 className="text-gold mb-3 text-3xl">{encounter.name}</h1>
      <CombatTracker
        encounterId={encounterId}
        initial={events}
        statBlocks={statBlocksFor(slugs)}
        endAction={endCombat.bind(null, encounterId)}
      />
    </div>
  );
}

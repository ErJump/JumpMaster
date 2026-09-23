import { PageHeader, Panel } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { CharacterForm } from '@/features/characters/components/CharacterForm';
import { createCharacter } from '@/features/characters/actions';

export default async function NewCharacterPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Una scheda personaggio" />;

  const { tipo } = await searchParams;
  const kind = tipo === 'npc' ? 'npc' : 'pc';
  const createHere = createCharacter.bind(null, campaign.id);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title={kind === 'pc' ? 'Nuovo personaggio giocante' : 'Nuovo PNG'}
        subtitle={
          kind === 'pc'
            ? 'Copia i numeri dalla scheda del giocatore. Li inserisci una volta sola.'
            : 'Chi è, dove sta, cosa vuole — e cosa nasconde.'
        }
        actions={
          <ButtonLink href={`/personaggi/nuovo?tipo=${kind === 'pc' ? 'npc' : 'pc'}`} variant="ghost">
            {kind === 'pc' ? 'Crea un PNG invece' : 'Crea un PG invece'}
          </ButtonLink>
        }
      />
      <Panel className="p-6">
        <CharacterForm action={createHere} kind={kind} submitLabel="Crea la scheda" />
      </Panel>
    </div>
  );
}

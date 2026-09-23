import { PageHeader } from '@/ui/components/primitives';
import { SetupNeeded } from '@/ui/components/SetupNeeded';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { partyProfile } from '@/features/characters/queries';
import { createNpcFromGenerator } from '@/features/characters/actions';
import { createNoteFromGenerator } from '@/features/notes/actions';
import { createEncounterFromGenerator } from '@/features/encounters/actions';
import { monsterCatalog } from '@/features/encounters/queries';
import { equipmentForShops, magicItemsForTreasure } from '@/db/queries/srd-catalog';
import { GeneratorsBoard } from '@/features/generators/components/GeneratorsBoard';

/**
 * I generatori funzionano anche senza campagna; per salvare ne serve una. È questa pagina a
 * comporre le slice: `generators` non importa `characters`, `notes` né `encounters` (I2).
 */
export default function GeneratorsPage() {
  const campaign = getActiveCampaign();
  const monsters = monsterCatalog();
  if (monsters.length === 0) return <SetupNeeded what="il materiale dei generatori" />;

  const party = campaign ? partyProfile(campaign.id) : { level: 1, size: 0 };
  const savers = campaign
    ? {
        saveNpc: createNpcFromGenerator.bind(null, campaign.id),
        saveNote: createNoteFromGenerator.bind(null, campaign.id),
        saveEncounter: createEncounterFromGenerator.bind(null, campaign.id),
      }
    : {};

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Generatori"
        subtitle="Per quando i giocatori vanno dove non hai preparato. Testi scritti per JumpMaster, mostri e oggetti dall’SRD."
      />
      <GeneratorsBoard
        monsters={monsters.map(({ slug, name, cr, xp, type }) => ({ slug, name, cr, xp, type }))}
        equipment={equipmentForShops()}
        magicItems={magicItemsForTreasure()}
        party={party}
        savers={savers}
      />
    </div>
  );
}

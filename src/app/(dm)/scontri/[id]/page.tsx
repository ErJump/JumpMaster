import { notFound } from 'next/navigation';
import { PageHeader, Panel, Badge } from '@/ui/components/primitives';
import { Button } from '@/ui/components/Button';
import { SetupNeeded } from '@/ui/components/SetupNeeded';
import { partyProfile } from '@/features/characters/queries';
import { getEncounter, monsterCatalog } from '@/features/encounters/queries';
import { updateEncounterMeta, deleteEncounter } from '@/features/encounters/actions';
import { ENCOUNTER_STATUS_LABELS } from '@/features/encounters/schema';
import { EncounterBuilder } from '@/features/encounters/components/EncounterBuilder';
import { EncounterMetaForm } from '@/features/encounters/components/EncounterMetaForm';
import { StartCombatForm } from '@/features/combat/components/StartCombatForm';
import { startCombat } from '@/features/combat/actions';

export default async function EncounterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encounterId = Number(id);
  if (!Number.isInteger(encounterId)) notFound();

  const found = getEncounter(encounterId);
  if (!found) notFound();
  const { encounter, monsters } = found;

  const catalog = monsterCatalog();
  if (catalog.length === 0) return <SetupNeeded what="il catalogo dei mostri" />;

  // Il gruppo di riferimento sono i PG veri della campagna dello scontro (SPEC-0006 AC5).
  // È la pagina a comporre le due slice: `encounters` non importa `characters` (invariante I2).
  const party = partyProfile(encounter.campaignId);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title={encounter.name}
        subtitle={encounter.description || undefined}
        actions={<Badge tone={encounter.status === 'running' ? 'bottle' : 'neutral'}>{ENCOUNTER_STATUS_LABELS[encounter.status]}</Badge>}
      />

      <div className="mb-6">
        <StartCombatForm
          action={startCombat.bind(null, encounter.id)}
          running={encounter.status === 'running'}
          disabled={monsters.length === 0}
        />
      </div>

      <EncounterBuilder
        encounterId={encounter.id}
        initial={monsters.map((monster) => ({ slug: monster.srdMonsterSlug, count: monster.count }))}
        catalog={catalog}
        party={party}
      />

      <details className="mt-10">
        <summary className="small-caps text-ink-faint hover:text-gold cursor-pointer text-base font-semibold">
          Nome, situazione e appunti
        </summary>
        <Panel className="mt-3 p-6">
          <EncounterMetaForm action={updateEncounterMeta.bind(null, encounter.id)} encounter={encounter} submitLabel="Salva" />
        </Panel>
      </details>

      <div className="mt-10">
        <h2 className="small-caps text-ink-faint mb-3 text-base font-semibold">Zona pericolosa</h2>
        <form action={deleteEncounter.bind(null, encounter.id)}>
          <Button type="submit" variant="danger">
            Elimina lo scontro
          </Button>
        </form>
      </div>
    </div>
  );
}

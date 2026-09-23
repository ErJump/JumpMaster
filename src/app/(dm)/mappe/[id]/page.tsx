import { notFound } from 'next/navigation';
import { PageHeader } from '@/ui/components/primitives';
import { Button } from '@/ui/components/Button';
import { loadMap } from '@/db/queries/maps';
import { runningCombat } from '@/db/queries/combat-log';
import { linkTargets } from '@/db/queries/links';
import { liveStateFor } from '@/features/player/queries';
import { showMap } from '@/features/player/actions';
import { saveMapState, deleteMap } from '@/features/maps/actions';
import { MapEditor } from '@/features/maps/components/MapEditor';

export default async function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const map = loadMap(Number(id));
  if (!map) notFound();

  const { row, spec } = map;
  // Lo stato del combattimento serve a mostrare i morti e i nascosti, e a proporre i segnalini.
  const combat = runningCombat(row.campaignId);
  const live = liveStateFor(row.campaignId);

  return (
    <div className="w-full">
      <PageHeader
        title={row.name}
        subtitle={
          spec.kind === 'battle'
            ? 'Muovi i segnalini, rivela la mappa un pezzo alla volta, misura le distanze.'
            : 'Segna i luoghi: ogni nome porta alla sua nota.'
        }
      />
      <MapEditor
        spec={spec}
        combatants={(combat?.state.combatants ?? []).map(({ id: cid, name, kind, status, hidden }) => ({ id: cid, name, kind, status, hidden }))}
        linkTargets={linkTargets(row.campaignId)}
        save={saveMapState.bind(null, row.id)}
        showToPlayers={showMap.bind(null, row.campaignId, row.id)}
        onAir={live.mode === 'map' && live.mapId === row.id}
      />
      <form action={deleteMap.bind(null, row.id)} className="mt-10">
        <Button type="submit" variant="danger">Elimina la mappa</Button>
      </form>
    </div>
  );
}

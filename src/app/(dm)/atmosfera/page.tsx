import { PageHeader } from '@/ui/components/primitives';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { listScenes, listTracks } from '@/features/ambience/queries';
import { createBaseScenes, createScene, deleteScene, deleteTrack, renameScene, saveSceneLayers } from '@/features/ambience/actions';
import { SceneBoard } from '@/features/ambience/components/SceneBoard';

export default function AmbiencePage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="L’atmosfera" />;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Atmosfera"
        subtitle="Un clic su una scena e parte il sottofondo; un clic su un’altra e si passa con una dissolvenza. Continua a suonare mentre giri per l’app."
      />
      <SceneBoard
        scenes={listScenes(campaign.id)}
        tracks={listTracks(campaign.id)}
        actions={{
          createBaseScenes: createBaseScenes.bind(null, campaign.id),
          createScene: createScene.bind(null, campaign.id),
          renameScene,
          saveSceneLayers,
          deleteScene,
          deleteTrack,
        }}
      />
    </div>
  );
}

import type { Metadata } from 'next';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { buildPlayerView } from '@/features/player/queries';
import { PlayerScreen } from '@/features/player/components/PlayerScreen';

// Fuori dal gruppo `(dm)`: nessuna navigazione del DM, nessuna informazione riservata.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'JumpMaster — Vista Giocatori' };

export default function PlayerPage() {
  const campaign = getActiveCampaign();
  // La prima pittura è già giusta; da lì in avanti aggiorna lo stream.
  const initial = buildPlayerView(campaign ? { id: campaign.id, name: campaign.name } : undefined);
  return <PlayerScreen initial={initial} />;
}

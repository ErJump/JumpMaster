import { EmptyState } from './primitives';
import { ButtonLink } from './Button';

/**
 * Mostrato dalle feature con `requiresCampaign` quando non c'è una campagna attiva
 * (SPEC-0002 AC8). Spiega cosa manca invece di rompersi o mostrare una pagina vuota.
 */
export function CampaignRequired({ what }: { what: string }) {
  return (
    <EmptyState
      icon="🏰"
      title="Serve una campagna attiva"
      description={`${what} appartiene a una campagna. Scegline una — o creane una nuova, le basta un nome.`}
      action={<ButtonLink href="/campagne">Vai alle campagne</ButtonLink>}
    />
  );
}

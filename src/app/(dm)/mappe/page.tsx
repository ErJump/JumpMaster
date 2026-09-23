import Link from 'next/link';
import { PageHeader, Badge, EmptyState } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { listMaps } from '@/features/maps/queries';
import { imageUrl } from '@/db/files';

export default function MapsPage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Una mappa" />;
  const maps = listMaps(campaign.id);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Mappe"
        count={maps.length || undefined}
        subtitle={`${campaign.name} — battlemap con nebbia di guerra e la mappa del mondo.`}
        actions={
          <div className="flex gap-2">
            <ButtonLink href="/mappe/nuova?tipo=battle">Nuova battlemap</ButtonLink>
            <ButtonLink href="/mappe/nuova?tipo=world" variant="ghost">Mappa del mondo</ButtonLink>
          </div>
        }
      />
      {maps.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="Nessuna mappa"
          description="Carica l’immagine di un dungeon o di una stanza: ci metti sopra la griglia, i segnalini e la nebbia di guerra, e la mostri ai giocatori un pezzo alla volta."
          action={<ButtonLink href="/mappe/nuova?tipo=battle">Carica una battlemap</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map((map) => (
            <li key={map.id}>
              <Link href={`/mappe/${map.id}`} className="panel hover:border-gold-soft block overflow-hidden transition-colors">
                {map.imageFile && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl(map.imageFile) ?? ''} alt="" className="aspect-video w-full object-cover" />
                )}
                <div className="flex items-baseline justify-between gap-2 p-3">
                  <span className="text-ink truncate text-lg font-semibold">{map.name}</span>
                  <Badge tone={map.kind === 'battle' ? 'wax' : 'gold'}>{map.kind === 'battle' ? 'tattica' : 'mondo'}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

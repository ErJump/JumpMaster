import { PageHeader, Panel, Badge, EmptyState } from '@/ui/components/primitives';
import { Button } from '@/ui/components/Button';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { liveStateFor, listHandouts, buildPlayerView } from '@/features/player/queries';
import { setLiveMode, showHandout, deleteHandout, createHandout } from '@/features/player/actions';
import { imageUrl } from '@/features/player/uploads';
import { OpenPlayerWindow } from '@/features/player/components/OpenPlayerWindow';
import { HandoutForm } from '@/features/player/components/HandoutForm';

export default function DirectionPage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="La Vista Giocatori" />;

  const live = liveStateFor(campaign.id);
  const view = buildPlayerView({ id: campaign.id, name: campaign.name });
  const handouts = listHandouts(campaign.id);

  const nowShowing =
    live.mode === 'blackout'
      ? 'Schermo oscurato'
      : view.kind === 'combat'
        ? `Combattimento in corso · round ${view.combat.round}`
        : view.kind === 'handout'
          ? `Handout: ${view.handout.title}`
          : 'Schermata d’attesa';

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Regia"
        subtitle="Cosa vedono i giocatori. Mai i PF esatti dei mostri, mai i tuoi appunti, mai i segreti."
        actions={<OpenPlayerWindow label="📺 Apri la finestra giocatori" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section>
          <h2 className="small-caps text-gold mb-2 text-lg">In onda adesso</h2>
          {/* L'anteprima È la pagina dei giocatori, rimpicciolita: quello che vedi è
              esattamente quello che vedono loro. */}
          <div className="panel relative aspect-video overflow-hidden">
            <iframe
              src="/player"
              title="Anteprima della Vista Giocatori"
              className="pointer-events-none absolute top-0 left-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
            />
          </div>
          <p className="text-ink mt-2 text-lg">{nowShowing}</p>
        </section>

        <section className="space-y-3">
          <h2 className="small-caps text-gold text-lg">Modalità</h2>
          <form action={setLiveMode.bind(null, campaign.id, 'auto')}>
            <Button type="submit" variant={live.mode === 'auto' ? 'primary' : 'ghost'} className="w-full justify-start">
              ⚔ Automatica
            </Button>
          </form>
          <p className="text-ink-faint -mt-1 text-sm">
            Mostra il combattimento quando ne avvii uno, altrimenti la schermata d’attesa.
          </p>
          <form action={setLiveMode.bind(null, campaign.id, 'blackout')}>
            <Button type="submit" variant={live.mode === 'blackout' ? 'danger' : 'ghost'} className="w-full justify-start">
              🌑 Oscura
            </Button>
          </form>
          <p className="text-ink-faint -mt-1 text-sm">Solo la schermata d’attesa, qualunque cosa succeda.</p>
        </section>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          <h2 className="small-caps text-gold mb-3 text-lg">Handout</h2>
          {handouts.length === 0 ? (
            <EmptyState
              icon="📜"
              title="Nessun handout"
              description="Lettere, mappe, ritratti di PNG: preparali prima e mostrali con un clic quando il gruppo li trova."
            />
          ) : (
            <ul className="space-y-3">
              {handouts.map((handout) => {
                const onAir = live.mode === 'handout' && live.handoutId === handout.id;
                const url = imageUrl(handout.imageFile);
                return (
                  <li key={handout.id} className={`panel flex items-center gap-4 p-3 ${onAir ? 'border-gold' : ''}`}>
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="h-16 w-24 shrink-0 rounded-xs object-cover" />
                    ) : (
                      <span className="text-ink-faint flex h-16 w-24 shrink-0 items-center justify-center text-3xl">📜</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-lg font-semibold">{handout.title}</p>
                      {handout.body && <p className="text-ink-faint truncate text-sm">{handout.body}</p>}
                    </div>
                    {onAir ? (
                      <Badge tone="gold">in onda</Badge>
                    ) : (
                      <form action={showHandout.bind(null, campaign.id, handout.id)}>
                        <Button type="submit">Mostra</Button>
                      </form>
                    )}
                    <form action={deleteHandout.bind(null, handout.id)}>
                      <button type="submit" className="text-ink-faint hover:text-wax px-2 text-lg" aria-label={`Elimina ${handout.title}`}>
                        ✕
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Panel className="self-start p-5">
          <h2 className="small-caps text-gold mb-3 text-lg">Nuovo handout</h2>
          <HandoutForm action={createHandout.bind(null, campaign.id)} />
        </Panel>
      </section>
    </div>
  );
}

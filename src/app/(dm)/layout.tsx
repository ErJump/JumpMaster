import Link from 'next/link';
import { Navigation } from '@/ui/components/Navigation';
import { ThemeToggle } from '@/ui/components/ThemeToggle';
import { OpenPlayerWindow } from '@/features/player/components/OpenPlayerWindow';
import { getActiveCampaign } from '@/features/campaigns/queries';

/**
 * Ogni pagina del pannello DM legge dal database a ogni richiesta.
 *
 * Senza questo, Next prerenderebbe l'elenco delle campagne **al momento della build**:
 * chi compila e poi lancia `npm start` si ritroverebbe con i dati congelati a quell'istante.
 * Per un'app locale in cui tutto è dato vivo, il rendering dinamico è l'unico corretto.
 */
export const dynamic = 'force-dynamic';

/**
 * Guscio del pannello di controllo del DM.
 *
 * La Vista Giocatori (M3) vivrà fuori da questo gruppo di rotte, con un layout tutto suo:
 * scala tipografica maggiorata e nessuna informazione riservata.
 */
export default function DmLayout({ children }: { children: React.ReactNode }) {
  const activeCampaign = getActiveCampaign();

  return (
    <div className="flex min-h-screen">
      <aside className="border-border bg-surface/60 sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r py-6 lg:flex">
        <Link href="/" className="mb-6 block px-5">
          <span className="text-gold block text-2xl leading-none font-semibold">⚔ JumpMaster</span>
          <span className="text-ink-faint small-caps block text-sm">Dungeon Master companion</span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto px-2">
          <Navigation />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-bg/80 sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-3 backdrop-blur">
          <Link href="/" className="text-gold text-xl font-semibold lg:hidden">
            ⚔ JumpMaster
          </Link>

          <div className="hidden min-w-0 lg:block">
            {activeCampaign ? (
              <Link href={`/campagne/${activeCampaign.id}`} className="group flex items-baseline gap-2">
                <span className="small-caps text-ink-faint text-sm">Campagna attiva</span>
                <span className="text-gold group-hover:text-gold truncate text-lg font-semibold">
                  {activeCampaign.name}
                </span>
              </Link>
            ) : (
              <Link href="/campagne" className="text-ink-faint hover:text-gold text-base">
                Nessuna campagna attiva — scegline una
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <OpenPlayerWindow />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col p-6">{children}</main>
      </div>
    </div>
  );
}

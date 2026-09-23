'use client';

import { useSyncExternalStore } from 'react';
import { classifyBrowser, type InstallableBrowser } from '@/lib/browser';

/**
 * Come usare JumpMaster come app, detto per il browser che si sta usando (SPEC-0017 AC8).
 * Non compare se JumpMaster è già aperto come app.
 */
type Situation = { standalone: boolean; browser: InstallableBrowser; mac: boolean } | null;

function detect(): Situation {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return { standalone, browser: classifyBrowser(navigator.userAgent), mac: /Macintosh/.test(navigator.userAgent) };
}

let cached: Situation = null;
const snapshot = () => (cached ??= detect());
// Il browser non cambia durante la visita: nessuna iscrizione da fare.
const subscribe = () => () => undefined;

export function InstallHint() {
  // Sul server non si sa che browser sia: `null`, e il riquadro compare solo nel browser.
  const situation = useSyncExternalStore(subscribe, snapshot, () => null);
  if (!situation || situation.standalone) return null;

  const how =
    situation.browser === 'safari'
      ? 'In Safari: menu File › Aggiungi al Dock. JumpMaster avrà la sua finestra, senza barra, con la sua icona.'
      : situation.browser === 'chromium'
        ? 'Clicca l’icona «Installa» a destra nella barra degli indirizzi: JumpMaster avrà la sua finestra, senza barra.'
        : 'Questo browser non installa app web.';

  return (
    <aside className="panel mt-10 space-y-2 p-5">
      <h2 className="small-caps text-gold text-lg">Usa JumpMaster come un’app</h2>
      <p className="text-ink-soft text-base leading-relaxed">
        {how} Una finestra sola è anche più pulita da condividere su Discord.
      </p>
      <p className="text-ink-soft text-base leading-relaxed">
        Senza terminale: <code className="text-ink font-mono">npm run app</code> avvia tutto e apre la finestra
        {situation.mac && (
          <>
            ; <code className="text-ink font-mono">npm run app:install</code> crea <strong className="text-ink">JumpMaster.app</strong> da tenere nel Dock
          </>
        )}
        .
      </p>
    </aside>
  );
}

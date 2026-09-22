import type { ReactNode } from 'react';

/**
 * Impalcatura a due riquadri del compendio: elenco ricercabile a sinistra, dettaglio a destra.
 * Sotto i 1024px i due riquadri si impilano, perché affiancarli renderebbe entrambi illeggibili.
 */
export function BrowserLayout({ browser, children }: { browser: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[22rem_1fr]">
      <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)]">{browser}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

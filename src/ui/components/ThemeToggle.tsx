'use client';

/**
 * Interruttore fra "notte in taverna" e "pergamena e inchiostro".
 *
 * Nessuno stato React: il tema vive nell'attributo `data-theme` sull'elemento radice
 * (impostato prima della prima pittura dallo script in `layout.tsx`) e il CSS decide
 * quale glifo mostrare. Tenere una copia in `useState` costringerebbe a sincronizzarla
 * col DOM dentro un effetto — un anti-pattern che introduce anche uno sfarfallio.
 *
 * La preferenza va in localStorage: è una comodità per chi guarda, non stato di dominio.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('jm-theme', next);
    } catch {
      // Navigazione privata o storage bloccato: il tema resta valido per questa sessione.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Cambia tema"
      aria-label="Cambia fra tema scuro e tema chiaro"
      className="border-border-strong text-ink-soft hover:text-gold hover:border-gold-soft rounded-xs border px-3 py-2 text-lg transition-colors"
    >
      <span aria-hidden className="only-dark">
        🕯
      </span>
      <span aria-hidden className="only-light">
        📜
      </span>
    </button>
  );
}

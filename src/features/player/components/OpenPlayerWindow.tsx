'use client';

/**
 * Apre la Vista Giocatori in una finestra **separata** (SPEC-0008 AC1), da trascinare sul
 * secondo monitor o da condividere su Discord. Il nome fisso della finestra fa sì che un
 * secondo clic la riporti in primo piano invece di aprirne un'altra.
 */
export function OpenPlayerWindow({ label = '📺 Vista Giocatori', className = '' }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.open('/player', 'jumpmaster-player', 'popup,width=1280,height=800')}
      title="Apri la finestra da mostrare ai giocatori"
      className={`border-border-strong text-ink-soft hover:text-gold hover:border-gold-soft small-caps rounded-xs border px-3 py-2 text-base transition-colors ${className}`}
    >
      {label}
    </button>
  );
}

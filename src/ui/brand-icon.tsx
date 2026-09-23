/**
 * L'icona di JumpMaster, disegnata in SVG e resa in PNG da `ImageResponse` (SPEC-0017): nessun
 * file binario nel repository, nessun carattere scaricato, funziona senza rete.
 *
 * Due spade incrociate dorate con una gemma ceralacca, su una tessera scura: la tessera ha il suo
 * fondo, quindi si legge sia nel Dock chiaro sia in quello scuro.
 */
const BG = '#14100c';
const GOLD = '#d9b64c';
const GOLD_DARK = '#8a6d1f';
const WAX = '#c1485b';

/** Una spada in verticale, punta in alto, in un riquadro 100×100 centrato in (50,50). */
function sword(rotate: number) {
  return (
    <g key={rotate} transform={`rotate(${rotate} 50 50)`}>
      {/* lama */}
      <path d="M50 8 L55 16 L55 62 L45 62 L45 16 Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.2" />
      <path d="M50 12 L50 60" stroke={GOLD_DARK} strokeWidth="1.2" />
      {/* guardia */}
      <rect x="36" y="62" width="28" height="6" rx="2" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.2" />
      {/* impugnatura e pomolo */}
      <rect x="47" y="68" width="6" height="16" fill={GOLD_DARK} />
      <circle cx="50" cy="88" r="5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.2" />
    </g>
  );
}

/**
 * `maskable`: le icone «mascherabili» vengono ritagliate a cerchio o a goccia dal sistema; il disegno
 * deve stare nell'80% centrale e il fondo arrivare ai bordi.
 */
export function BrandIcon({ size, maskable = false }: { size: number; maskable?: boolean }) {
  const inset = maskable ? 0 : Math.round(size * 0.06);
  const radius = maskable ? 0 : Math.round(size * 0.2);
  const art = maskable ? 0.62 : 0.78;
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: maskable ? BG : 'transparent' }}>
      <div
        style={{
          width: size - inset * 2,
          height: size - inset * 2,
          borderRadius: radius,
          background: BG,
          border: maskable ? 'none' : `${Math.max(1, Math.round(size * 0.025))}px solid ${GOLD_DARK}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={size * art} height={size * art} viewBox="0 0 100 100">
          {/* Chiamate, non <Sword />: il motore di ImageResponse non espande componenti dentro un <svg>. */}
          {sword(-40)}
          {sword(40)}
          <circle cx="50" cy="50" r="7" fill={WAX} stroke={GOLD} strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

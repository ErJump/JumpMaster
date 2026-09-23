/**
 * Strati SVG di una mappa, in coordinate dell'immagine (il `viewBox` è la sua dimensione in
 * pixel). Condivisi dall'editor del DM e dalla Vista Giocatori: nessuna logica, solo disegno.
 */
import type { GridSpec } from '@/core/maps';

/** Il colore dei segnalini dei PG, dei mostri e dei PNG: si riconoscono prima di leggerli. */
export const TOKEN_COLORS = {
  pc: '#4c9a72',
  monster: '#c1485b',
  npc: '#d9b64c',
} as const;

export const TOKEN_PALETTE = ['#c1485b', '#4c9a72', '#d9b64c', '#a583d4', '#5b8fd9', '#e08a3c', '#9b8a6f', '#e8e0d0'] as const;

export function GridLayer({ width, height, grid, id }: { width: number; height: number; grid: GridSpec; id: string }) {
  return (
    <>
      <defs>
        <pattern id={id} x={grid.offsetX} y={grid.offsetY} width={grid.size} height={grid.size} patternUnits="userSpaceOnUse">
          <path d={`M ${grid.size} 0 L 0 0 0 ${grid.size}`} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={Math.max(1, grid.size / 50)} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} pointerEvents="none" />
    </>
  );
}

/** Copre le caselle NON rivelate. Il DM la vede semitrasparente, i giocatori opaca (SPEC-0012 AC10). */
export function FogLayer({
  cols,
  rows,
  grid,
  revealed,
  opacity,
}: {
  cols: number;
  rows: number;
  grid: GridSpec;
  revealed: ReadonlySet<string>;
  opacity: number;
}) {
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (revealed.has(`${col},${row}`)) continue;
      cells.push(
        <rect
          key={`${col},${row}`}
          x={grid.offsetX + col * grid.size}
          y={grid.offsetY + row * grid.size}
          // Un pixel in più per lato: niente fessure fra caselle coperte.
          width={grid.size + 1}
          height={grid.size + 1}
        />,
      );
    }
  }
  return (
    <g fill="#0b0907" opacity={opacity} pointerEvents="none">
      {/* Le strisce oltre il bordo della griglia, se c'è uno scostamento, restano coperte. */}
      {grid.offsetX > 0 && <rect x={0} y={0} width={grid.offsetX} height={grid.offsetY + rows * grid.size} />}
      {grid.offsetY > 0 && <rect x={0} y={0} width={grid.offsetX + cols * grid.size} height={grid.offsetY} />}
      {cells}
    </g>
  );
}

function initials(label: string): string {
  const words = label.trim().split(/\s+/);
  // «Goblin 3» → «G3»: il numero distingue le copie dello stesso mostro.
  const number = words.at(-1)?.match(/^\d+$/)?.[0];
  if (number) return `${words[0]!.charAt(0).toUpperCase()}${number}`;
  return words.length > 1 ? `${words[0]!.charAt(0)}${words[1]!.charAt(0)}`.toUpperCase() : label.slice(0, 2);
}

export function TokenGlyph({
  label,
  color,
  col,
  row,
  size,
  grid,
  dead = false,
  active = false,
  hidden = false,
  selected = false,
  onPointerDown,
}: {
  label: string;
  color: string;
  col: number;
  row: number;
  size: number;
  grid: GridSpec;
  dead?: boolean;
  active?: boolean;
  hidden?: boolean;
  selected?: boolean;
  onPointerDown?: (event: React.PointerEvent<SVGGElement>) => void;
}) {
  const side = size * grid.size;
  const cx = grid.offsetX + col * grid.size + side / 2;
  const cy = grid.offsetY + row * grid.size + side / 2;
  const r = side * 0.42;

  return (
    <g
      onPointerDown={onPointerDown}
      style={{ cursor: onPointerDown ? 'grab' : undefined }}
      opacity={dead ? 0.4 : 1}
    >
      <title>{label}</title>
      {active && <circle cx={cx} cy={cy} r={r + side * 0.08} fill="none" stroke="#d9b64c" strokeWidth={side * 0.06} />}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke={selected ? '#ffffff' : '#0b0907'}
        strokeWidth={side * (selected ? 0.05 : 0.03)}
        strokeDasharray={hidden ? `${side * 0.08} ${side * 0.05}` : undefined}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 0.8}
        fontWeight={700}
        fill="#0b0907"
        style={{ fontFamily: 'var(--font-body)', pointerEvents: 'none', userSelect: 'none' }}
      >
        {initials(label)}
      </text>
      {dead && (
        <path
          d={`M ${cx - r * 0.6} ${cy - r * 0.6} L ${cx + r * 0.6} ${cy + r * 0.6} M ${cx + r * 0.6} ${cy - r * 0.6} L ${cx - r * 0.6} ${cy + r * 0.6}`}
          stroke="#0b0907"
          strokeWidth={side * 0.06}
          pointerEvents="none"
        />
      )}
    </g>
  );
}

export function PinGlyph({
  x,
  y,
  label,
  width,
  known = true,
  selected = false,
  onPointerDown,
}: {
  x: number;
  y: number;
  label: string;
  width: number;
  known?: boolean;
  selected?: boolean;
  onPointerDown?: (event: React.PointerEvent<SVGGElement>) => void;
}) {
  // Dimensione proporzionale all'immagine: leggibile su mappe grandi e piccole.
  const unit = width / 90;
  return (
    <g onPointerDown={onPointerDown} style={{ cursor: onPointerDown ? 'grab' : undefined }}>
      <title>{label}</title>
      <circle cx={x} cy={y} r={unit * 0.9} fill={known ? '#d9b64c' : '#a583d4'} stroke={selected ? '#fff' : '#0b0907'} strokeWidth={unit * 0.25} />
      <text
        x={x}
        y={y - unit * 1.6}
        textAnchor="middle"
        fontSize={unit * 1.6}
        fontWeight={700}
        fill="#fbf5e6"
        stroke="#0b0907"
        strokeWidth={unit * 0.35}
        paintOrder="stroke"
        style={{ fontFamily: 'var(--font-display)', pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  );
}

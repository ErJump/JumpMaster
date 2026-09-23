'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  cellAt,
  cellRect,
  cellsInRect,
  coverRect,
  distanceFeet,
  gridDimensions,
  revealAll,
  revealRect,
  type Cell,
  type GridSpec,
  type MapSpec,
  type Pin,
  type Token,
} from '@/core/maps';
import { resolveLinkIn, type LinkTargets } from '@/lib/wikilinks';
import { Button } from '@/ui/components/Button';
import { FogLayer, GridLayer, PinGlyph, TokenGlyph, TOKEN_COLORS, TOKEN_PALETTE } from '@/ui/components/MapLayers';
import { useAutosave, AUTOSAVE_LABEL } from '@/ui/hooks/useAutosave';
import type { MapState } from '../actions';

export interface CombatantOption {
  id: string;
  name: string;
  kind: 'pc' | 'npc' | 'monster';
  status: 'active' | 'unconscious' | 'stable' | 'dead';
  hidden: boolean;
}

type Mode = 'move' | 'reveal' | 'cover' | 'measure' | 'pin';

type Drag =
  | { kind: 'token'; id: string; grabCol: number; grabRow: number }
  | { kind: 'pin'; id: string }
  | { kind: 'rect'; from: Cell; to: Cell }
  | { kind: 'measure'; from: Cell; to: Cell };

const MODES_BATTLE: Array<{ id: Mode; label: string; hint: string }> = [
  { id: 'move', label: '✋ Muovi', hint: 'Trascina i segnalini: si agganciano alla casella.' },
  { id: 'reveal', label: '☀️ Rivela', hint: 'Trascina un rettangolo per rivelare la zona ai giocatori.' },
  { id: 'cover', label: '🌫️ Copri', hint: 'Trascina un rettangolo per coprire di nuovo la zona.' },
  { id: 'measure', label: '📏 Misura', hint: 'Trascina da una casella all’altra: 5 ft per casella, diagonali comprese (SRD).' },
];

const MODES_WORLD: Array<{ id: Mode; label: string; hint: string }> = [
  { id: 'pin', label: '📍 Aggiungi luogo', hint: 'Clicca sulla mappa per aggiungere un segnaposto.' },
  { id: 'move', label: '✋ Sposta', hint: 'Trascina i segnaposto.' },
];

const newId = () => crypto.randomUUID();

/** Cattura il puntatore per seguire il trascinamento anche fuori dall'SVG; se il dispositivo non lo consente, si prosegue senza. */
function capture(element: Element, pointerId: number): void {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Alcuni dispositivi di input non lo supportano: il trascinamento funziona lo stesso dentro la mappa.
  }
}

function toImage(svg: SVGSVGElement, event: React.PointerEvent): { x: number; y: number } {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  return matrix ? point.matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
}

export function MapEditor({
  spec,
  combatants,
  linkTargets,
  save,
  showToPlayers,
  onAir,
}: {
  spec: MapSpec;
  combatants: CombatantOption[];
  linkTargets: LinkTargets;
  save: (state: MapState) => Promise<{ error?: string }>;
  showToPlayers: () => Promise<void>;
  onAir: boolean;
}) {
  const isBattle = spec.kind === 'battle';
  const [grid, setGrid] = useState<GridSpec>(spec.grid);
  const [showGrid, setShowGrid] = useState(spec.showGrid);
  const [fog, setFog] = useState<string[]>(spec.fog);
  const [tokens, setTokens] = useState<Token[]>(spec.tokens);
  const [pins, setPins] = useState<Pin[]>(spec.pins);
  const [mode, setMode] = useState<Mode>(isBattle ? 'move' : 'pin');
  const [selected, setSelected] = useState<string | null>(null);
  // Il trascinamento vive in un riferimento sincrono, non solo nello stato di React: lo stato si
  // aggiorna al render successivo, e se un movimento e il rilascio cadono nello stesso fotogramma
  // i gestori leggerebbero valori vecchi (un segnalino trascinato di scatto tornerebbe indietro).
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (next: Drag | null) => {
    dragRef.current = next;
    setDragState(next);
  };
  const [ruler, setRuler] = useState<{ from: Cell; to: Cell } | null>(null);
  const [airing, startAiring] = useTransition();
  const svgRef = useRef<SVGSVGElement>(null);

  // Ritardo breve: la Vista Giocatori deve seguire i movimenti quasi in tempo reale.
  const { status, error, schedule } = useAutosave(save, 250);

  const dims = useMemo(() => gridDimensions(spec.imageWidth, spec.imageHeight, grid), [spec.imageWidth, spec.imageHeight, grid]);
  const revealed = useMemo(() => new Set(fog), [fog]);
  const byCombatant = useMemo(() => new Map(combatants.map((c) => [c.id, c])), [combatants]);

  // Ultimo stato noto, per i gestori degli eventi: si allinea dopo ogni render e si aggiorna
  // subito a ogni modifica, così più modifiche nello stesso istante si sommano invece di perdersi.
  const latest = useRef<MapState>({
    gridSize: spec.grid.size,
    gridOffsetX: spec.grid.offsetX,
    gridOffsetY: spec.grid.offsetY,
    showGrid: spec.showGrid,
    fog: spec.fog,
    tokens: spec.tokens,
    pins: spec.pins,
  });
  useEffect(() => {
    latest.current = { gridSize: grid.size, gridOffsetX: grid.offsetX, gridOffsetY: grid.offsetY, showGrid, fog, tokens, pins };
  });

  function commit(next: Partial<MapState>) {
    const state: MapState = { ...latest.current, ...next };
    latest.current = state;
    if (next.fog) setFog(next.fog);
    if (next.tokens) setTokens(next.tokens);
    if (next.pins) setPins(next.pins);
    if (next.showGrid !== undefined) setShowGrid(next.showGrid);
    if (next.gridSize !== undefined || next.gridOffsetX !== undefined || next.gridOffsetY !== undefined) {
      setGrid({ size: state.gridSize, offsetX: state.gridOffsetX, offsetY: state.gridOffsetY });
    }
    // Mentre il DM riscrive il nome di un luogo il campo può essere vuoto per un attimo: si salva
    // «Senza nome» invece di far fallire la validazione, e il campo resta com'è.
    schedule({ ...state, pins: state.pins.map((p) => ({ ...p, label: p.label.trim() || 'Senza nome' })) });
  }

  /* ── puntatore ─────────────────────────────────────────────────── */

  function onCanvasDown(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || event.button !== 0) return;
    const point = toImage(svg, event);
    const cell = cellAt(point, grid);

    if (mode === 'pin') {
      const pin: Pin = {
        id: newId(),
        x: Math.min(1, Math.max(0, point.x / spec.imageWidth)),
        y: Math.min(1, Math.max(0, point.y / spec.imageHeight)),
        label: 'Nuovo luogo',
        known: false,
      };
      commit({ pins: [...latest.current.pins, pin] });
      setSelected(pin.id);
      return;
    }
    if (mode === 'reveal' || mode === 'cover') setDrag({ kind: 'rect', from: cell, to: cell });
    if (mode === 'measure') {
      setRuler(null);
      setDrag({ kind: 'measure', from: cell, to: cell });
    }
    if (mode === 'move') setSelected(null);
    capture(svg, event.pointerId);
  }

  function onTokenDown(token: Token, event: React.PointerEvent<SVGGElement>) {
    if (mode !== 'move') return;
    event.stopPropagation();
    const svg = svgRef.current!;
    const cell = cellAt(toImage(svg, event), grid);
    setSelected(token.id);
    setDrag({ kind: 'token', id: token.id, grabCol: cell.col - token.col, grabRow: cell.row - token.row });
    capture(svg, event.pointerId);
  }

  function onPinDown(pin: Pin, event: React.PointerEvent<SVGGElement>) {
    event.stopPropagation();
    setSelected(pin.id);
    if (mode !== 'move') return;
    setDrag({ kind: 'pin', id: pin.id });
    capture(svgRef.current!, event.pointerId);
  }

  function onCanvasMove(event: React.PointerEvent<SVGSVGElement>) {
    const current = dragRef.current;
    if (!current || !svgRef.current) return;
    const point = toImage(svgRef.current, event);
    const cell = cellAt(point, grid);

    // Qui si aggiorna solo l'anteprima: il valore definitivo lo decide il rilascio.
    if (current.kind === 'token') {
      setTokens((all) => all.map((t) => (t.id === current.id ? { ...t, col: cell.col - current.grabCol, row: cell.row - current.grabRow } : t)));
    } else if (current.kind === 'pin') {
      const x = Math.min(1, Math.max(0, point.x / spec.imageWidth));
      const y = Math.min(1, Math.max(0, point.y / spec.imageHeight));
      setPins((all) => all.map((p) => (p.id === current.id ? { ...p, x, y } : p)));
    } else {
      setDrag({ ...current, to: cell });
    }
  }

  function onCanvasUp(event: React.PointerEvent<SVGSVGElement>) {
    const current = dragRef.current;
    if (!current || !svgRef.current) return;
    const point = toImage(svgRef.current, event);
    const state = latest.current;
    const liveGrid = { size: state.gridSize, offsetX: state.gridOffsetX, offsetY: state.gridOffsetY };
    const cell = cellAt(point, liveGrid);
    const liveDims = gridDimensions(spec.imageWidth, spec.imageHeight, liveGrid);

    // La posizione finale si calcola dall'evento di rilascio, non dall'ultima anteprima.
    if (current.kind === 'token') {
      commit({
        tokens: state.tokens.map((t) => (t.id === current.id ? { ...t, col: cell.col - current.grabCol, row: cell.row - current.grabRow } : t)),
      });
    } else if (current.kind === 'pin') {
      const x = Math.min(1, Math.max(0, point.x / spec.imageWidth));
      const y = Math.min(1, Math.max(0, point.y / spec.imageHeight));
      commit({ pins: state.pins.map((p) => (p.id === current.id ? { ...p, x, y } : p)) });
    } else if (current.kind === 'rect') {
      commit({
        fog: mode === 'reveal' ? revealRect(state.fog, current.from, cell, liveDims) : coverRect(state.fog, current.from, cell, liveDims),
      });
    } else {
      // Il righello resta visibile finché non si misura di nuovo: si legge con calma.
      setRuler({ from: current.from, to: cell });
    }
    setDrag(null);
  }

  /* ── segnalini ─────────────────────────────────────────────────── */

  const onMap = new Set(tokens.map((t) => t.combatantId).filter(Boolean));
  const missing = combatants.filter((c) => !onMap.has(c.id));

  function addFromCombat() {
    // Si dispongono in fila sulla prima riga libera, pronti da trascinare dove servono.
    const occupied = new Set(tokens.map((t) => `${t.col},${t.row}`));
    const added: Token[] = [];
    let col = 0;
    let row = 0;
    for (const combatant of missing) {
      while (occupied.has(`${col},${row}`)) {
        col++;
        if (col >= dims.cols) {
          col = 0;
          row++;
        }
      }
      occupied.add(`${col},${row}`);
      added.push({
        id: newId(),
        label: combatant.name,
        color: TOKEN_COLORS[combatant.kind],
        col,
        row,
        size: 1,
        combatantId: combatant.id,
        hidden: false,
      });
    }
    commit({ tokens: [...latest.current.tokens, ...added] });
  }

  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState<string>(TOKEN_PALETTE[0]);
  const [newSize, setNewSize] = useState(1);

  function addToken() {
    if (!newLabel.trim()) return;
    const token: Token = { id: newId(), label: newLabel.trim(), color: newColor, col: 0, row: 0, size: newSize, combatantId: null, hidden: false };
    commit({ tokens: [...latest.current.tokens, token] });
    setSelected(token.id);
    setNewLabel('');
  }

  const selectedToken = tokens.find((t) => t.id === selected);
  const selectedPin = pins.find((p) => p.id === selected);
  const updateToken = (patch: Partial<Token>) => selectedToken && commit({ tokens: tokens.map((t) => (t.id === selectedToken.id ? { ...t, ...patch } : t)) });
  const updatePin = (patch: Partial<Pin>) => selectedPin && commit({ pins: pins.map((p) => (p.id === selectedPin.id ? { ...p, ...patch } : p)) });

  /* ── righello e anteprima ──────────────────────────────────────── */

  const center = (cell: Cell) => {
    const rect = cellRect(cell, grid);
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  };

  const modes = isBattle ? MODES_BATTLE : MODES_WORLD;
  const hint = modes.find((m) => m.id === mode)?.hint;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => {
                setMode(m.id);
                setDrag(null);
                setRuler(null);
              }}
              className={`rounded-xs border px-3 py-1.5 text-base transition-colors ${
                mode === m.id ? 'border-gold bg-gold/15 text-gold' : 'border-border-strong text-ink-soft hover:text-ink'
              }`}
            >
              {m.label}
            </button>
          ))}
          <span className="text-ink-faint ml-auto text-sm" aria-live="polite">{error ?? AUTOSAVE_LABEL[status]}</span>
        </div>
        <p className="text-ink-faint text-sm">{hint}</p>

        <div className="panel overflow-hidden p-1">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${spec.imageWidth} ${spec.imageHeight}`}
            className="block h-auto w-full touch-none select-none"
            onPointerDown={onCanvasDown}
            onPointerMove={onCanvasMove}
            onPointerUp={onCanvasUp}
            style={{ cursor: mode === 'move' ? 'default' : 'crosshair' }}
          >
            {spec.imageUrl && <image href={spec.imageUrl} width={spec.imageWidth} height={spec.imageHeight} />}
            {isBattle && showGrid && <GridLayer width={spec.imageWidth} height={spec.imageHeight} grid={grid} id="dm-grid" />}
            {isBattle && <FogLayer cols={dims.cols} rows={dims.rows} grid={grid} revealed={revealed} opacity={0.55} />}

            {isBattle &&
              tokens.map((token) => {
                const combatant = token.combatantId ? byCombatant.get(token.combatantId) : undefined;
                return (
                  <TokenGlyph
                    key={token.id}
                    {...token}
                    grid={grid}
                    dead={combatant?.status === 'dead'}
                    hidden={token.hidden || combatant?.hidden === true}
                    selected={token.id === selected}
                    onPointerDown={(event) => onTokenDown(token, event)}
                  />
                );
              })}

            {!isBattle &&
              pins.map((pin) => (
                <PinGlyph
                  key={pin.id}
                  x={pin.x * spec.imageWidth}
                  y={pin.y * spec.imageHeight}
                  label={pin.label}
                  width={spec.imageWidth}
                  known={pin.known}
                  selected={pin.id === selected}
                  onPointerDown={(event) => onPinDown(pin, event)}
                />
              ))}

            {drag?.kind === 'rect' &&
              (() => {
                const cells = cellsInRect(drag.from, drag.to, dims);
                const first = cellRect(cells[0]!, grid);
                const last = cellRect(cells.at(-1)!, grid);
                return (
                  <rect
                    x={first.x}
                    y={first.y}
                    width={last.x + last.width - first.x}
                    height={last.y + last.height - first.y}
                    fill={mode === 'reveal' ? 'rgba(217,182,76,0.25)' : 'rgba(11,9,7,0.6)'}
                    stroke="#d9b64c"
                    strokeWidth={Math.max(2, grid.size / 25)}
                    strokeDasharray={`${grid.size / 6} ${grid.size / 10}`}
                    pointerEvents="none"
                  />
                );
              })()}

            {(drag?.kind === 'measure' ? drag : ruler) &&
              (() => {
                const line = (drag?.kind === 'measure' ? drag : ruler)!;
                const a = center(line.from);
                const b = center(line.to);
                const feet = distanceFeet(line.from, line.to);
                return (
                  <g pointerEvents="none">
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d9b64c" strokeWidth={grid.size / 12} strokeLinecap="round" />
                    <circle cx={a.x} cy={a.y} r={grid.size / 8} fill="#d9b64c" />
                    <text
                      x={b.x}
                      y={b.y - grid.size * 0.45}
                      textAnchor="middle"
                      fontSize={grid.size * 0.5}
                      fontWeight={700}
                      fill="#fbf5e6"
                      stroke="#0b0907"
                      strokeWidth={grid.size / 18}
                      paintOrder="stroke"
                    >
                      {feet} ft
                    </text>
                  </g>
                );
              })()}
          </svg>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="panel space-y-2 p-4">
          {onAir ? (
            <p className="text-gold small-caps text-base">📺 In onda nella Vista Giocatori</p>
          ) : (
            <Button className="w-full" disabled={airing} onClick={() => startAiring(showToPlayers)}>
              📺 Mostra ai giocatori
            </Button>
          )}
          <p className="text-ink-faint text-sm leading-relaxed">
            {isBattle
              ? 'Ai giocatori arrivano solo i segnalini fuori dalla nebbia e non nascosti. La nebbia copre l’immagine: la Vista si mostra, non si consegna.'
              : 'Ai giocatori arrivano solo i luoghi segnati come noti.'}
          </p>
        </div>

        {isBattle && (
          <>
            <div className="panel space-y-3 p-4">
              <h3 className="small-caps text-gold text-lg">Segnalini</h3>
              {missing.length > 0 && (
                <Button variant="ghost" className="w-full" onClick={addFromCombat}>
                  ⚔ Aggiungi i {missing.length} combattenti dello scontro
                </Button>
              )}
              <div className="flex gap-2">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToken()}
                  placeholder="Nome del segnalino"
                  className="panel text-ink placeholder:text-ink-faint min-w-0 flex-1 px-2 py-1.5 text-base outline-none"
                />
                <select value={newSize} onChange={(e) => setNewSize(Number(e.target.value))} aria-label="Taglia" className="panel text-ink px-1 text-base outline-none">
                  <option value={1}>1×1</option>
                  <option value={2}>2×2</option>
                  <option value={3}>3×3</option>
                  <option value={4}>4×4</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                {TOKEN_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Colore ${color}`}
                    onClick={() => setNewColor(color)}
                    className={`h-6 w-6 rounded-full border-2 ${newColor === color ? 'border-white' : 'border-transparent'}`}
                    style={{ background: color }}
                  />
                ))}
                <Button variant="ghost" className="ml-auto px-3 py-1" onClick={addToken} disabled={!newLabel.trim()}>
                  Aggiungi
                </Button>
              </div>

              {selectedToken && (
                <div className="border-border space-y-2 border-t pt-3">
                  <p className="text-ink text-lg font-semibold">{selectedToken.label}</p>
                  <label className="text-ink-soft flex items-center gap-2 text-base">
                    <input type="checkbox" checked={selectedToken.hidden} onChange={(e) => updateToken({ hidden: e.target.checked })} className="accent-[var(--jm-arcane)]" />
                    Nascosto ai giocatori
                  </label>
                  <div className="flex gap-2">
                    <select value={selectedToken.size} onChange={(e) => updateToken({ size: Number(e.target.value) })} aria-label="Taglia" className="panel text-ink px-2 py-1 text-base outline-none">
                      <option value={1}>1×1 media</option>
                      <option value={2}>2×2 grande</option>
                      <option value={3}>3×3 enorme</option>
                      <option value={4}>4×4 mastodontica</option>
                    </select>
                    <Button
                      variant="danger"
                      className="px-3 py-1"
                      onClick={() => {
                        commit({ tokens: tokens.filter((t) => t.id !== selectedToken.id) });
                        setSelected(null);
                      }}
                    >
                      Togli
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="panel space-y-2 p-4">
              <h3 className="small-caps text-gold text-lg">Nebbia</h3>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 px-2" onClick={() => commit({ fog: revealAll(dims) })}>Rivela tutto</Button>
                <Button variant="ghost" className="flex-1 px-2" onClick={() => commit({ fog: [] })}>Copri tutto</Button>
              </div>
            </div>

            <details className="panel p-4">
              <summary className="small-caps text-gold cursor-pointer text-lg">Griglia</summary>
              <div className="mt-3 space-y-3">
                <p className="text-ink-faint text-sm">Regola finché combacia coi quadretti disegnati sulla mappa.</p>
                {(
                  [
                    ['Lato casella', 'gridSize', grid.size, 10, 300],
                    ['Scostamento orizzontale', 'gridOffsetX', grid.offsetX, 0, Math.max(0, grid.size - 1)],
                    ['Scostamento verticale', 'gridOffsetY', grid.offsetY, 0, Math.max(0, grid.size - 1)],
                  ] as const
                ).map(([label, key, value, min, max]) => (
                  <label key={key} className="block">
                    <span className="text-ink-soft flex justify-between text-sm">
                      {label} <span className="font-mono">{value} px</span>
                    </span>
                    <input type="range" min={min} max={max} value={value} onChange={(e) => commit({ [key]: Number(e.target.value) })} className="w-full accent-[var(--jm-gold)]" />
                  </label>
                ))}
                <label className="text-ink-soft flex items-center gap-2 text-base">
                  <input type="checkbox" checked={showGrid} onChange={(e) => commit({ showGrid: e.target.checked })} className="accent-[var(--jm-gold)]" />
                  Mostra la griglia
                </label>
                <p className="text-ink-faint text-sm">{dims.cols} × {dims.rows} caselle</p>
              </div>
            </details>
          </>
        )}

        {!isBattle && (
          <div className="panel space-y-3 p-4">
            <h3 className="small-caps text-gold text-lg">Luoghi</h3>
            {pins.length === 0 && <p className="text-ink-faint text-base">Clicca sulla mappa per segnare un luogo.</p>}
            {selectedPin && (
              <div className="space-y-2">
                <input
                  value={selectedPin.label}
                  onChange={(e) => updatePin({ label: e.target.value })}
                  aria-label="Nome del luogo"
                  className="panel text-ink w-full px-2 py-1.5 text-base outline-none"
                />
                <label className="text-ink-soft flex items-center gap-2 text-base">
                  <input type="checkbox" checked={selectedPin.known} onChange={(e) => updatePin({ known: e.target.checked })} className="accent-[var(--jm-gold)]" />
                  Noto ai giocatori
                </label>
                {(() => {
                  const link = resolveLinkIn(linkTargets, selectedPin.label);
                  return (
                    <Link href={link.href} className={link.missing ? 'text-wax text-base underline decoration-dashed' : 'text-gold text-base underline'}>
                      {link.missing ? `Crea la nota «${selectedPin.label}»` : `Apri «${selectedPin.label}»`}
                    </Link>
                  );
                })()}
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => {
                    commit({ pins: pins.filter((p) => p.id !== selectedPin.id) });
                    setSelected(null);
                  }}
                >
                  Togli il segnaposto
                </Button>
              </div>
            )}
            <ul className="space-y-1">
              {pins.map((pin) => (
                <li key={pin.id}>
                  <button type="button" onClick={() => setSelected(pin.id)} className={`text-base ${pin.id === selected ? 'text-gold' : 'text-ink hover:text-gold'}`}>
                    {pin.known ? '📍' : '🔒'} {pin.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

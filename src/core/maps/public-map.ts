/**
 * Ciò che vedono i giocatori di una mappa — SPEC-0012 AC13, SPEC-0013 AC5.
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * Come `PublicCombatant` (ADR-0009), `PublicToken` è un **tipo diverso**: niente `hidden`, niente
 * `combatantId`. E arrivano solo i segnalini che i giocatori potrebbero davvero vedere: quelli
 * sotto la nebbia o nascosti **non esistono** nei dati inviati (ADR-0012). La nebbia sull'immagine
 * è invece un velo, e l'ADR lo dichiara.
 */
import type { CombatState } from '../events/combat-types';
import { cellKey, gridDimensions, tokenCells } from './grid';
import type { GridSpec, MapSpec } from './types';

export interface PublicToken {
  id: string;
  label: string;
  color: string;
  col: number;
  row: number;
  size: number;
  dead: boolean;
  /** È il suo turno nel combattimento in corso. */
  active: boolean;
}

export type PublicMap =
  | {
      kind: 'battle';
      imageUrl: string | null;
      width: number;
      height: number;
      grid: GridSpec;
      showGrid: boolean;
      cols: number;
      rows: number;
      revealed: string[];
      tokens: PublicToken[];
      /** Chi è di turno, se c'è un combattimento e non è un nascosto. */
      turn: string | null;
    }
  | {
      kind: 'world';
      imageUrl: string | null;
      width: number;
      height: number;
      pins: Array<{ id: string; x: number; y: number; label: string }>;
    };

export function toPublicMap(map: MapSpec, combat: CombatState | null): PublicMap {
  if (map.kind === 'world') {
    return {
      kind: 'world',
      imageUrl: map.imageUrl,
      width: map.imageWidth,
      height: map.imageHeight,
      pins: map.pins.filter((p) => p.known).map(({ id, x, y, label }) => ({ id, x, y, label })),
    };
  }

  const dims = gridDimensions(map.imageWidth, map.imageHeight, map.grid);
  const revealed = new Set(map.fog);
  const byId = new Map((combat?.combatants ?? []).map((c) => [c.id, c]));
  const isVisible = (token: MapSpec['tokens'][number]) => {
    if (token.hidden) return false;
    const combatant = token.combatantId ? byId.get(token.combatantId) : undefined;
    if (combatant?.hidden) return false;
    // Visibile solo se almeno una delle sue caselle è rivelata: sotto la nebbia non esiste.
    return tokenCells(token).some((cell) => revealed.has(cellKey(cell)));
  };

  // Il turno si annuncia solo se non tradisce nulla: chi agisce non dev'essere nascosto e, se ha
  // un segnalino su questa mappa, quel segnalino dev'essere visibile. Altrimenti «Tocca a Flesh
  // Golem» annuncerebbe proprio il mostro che la nebbia sta nascondendo.
  const current = combat ? combat.combatants[combat.turnIndex] : undefined;
  const currentTokens = current ? map.tokens.filter((token) => token.combatantId === current.id) : [];
  const visibleTurn =
    current && !current.hidden && (currentTokens.length === 0 || currentTokens.some(isVisible)) ? current : undefined;

  const tokens: PublicToken[] = map.tokens
    .filter(isVisible)
    .map((token) => {
      const combatant = token.combatantId ? byId.get(token.combatantId) : undefined;
      return {
        id: token.id,
        label: token.label,
        color: token.color,
        col: token.col,
        row: token.row,
        size: token.size,
        dead: combatant?.status === 'dead',
        active: visibleTurn !== undefined && token.combatantId === visibleTurn.id,
      };
    });

  return {
    kind: 'battle',
    imageUrl: map.imageUrl,
    width: map.imageWidth,
    height: map.imageHeight,
    grid: map.grid,
    showGrid: map.showGrid,
    cols: dims.cols,
    rows: dims.rows,
    revealed: map.fog.filter((key) => {
      const [col, row] = key.split(',').map(Number);
      return col! >= 0 && row! >= 0 && col! < dims.cols && row! < dims.rows;
    }),
    tokens,
    turn: visibleTurn?.name ?? null,
  };
}

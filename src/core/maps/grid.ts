/**
 * Griglia, distanze e nebbia di guerra — SPEC-0012. ⚠ Modulo puro (invariante I1).
 */
import type { Cell, GridSpec } from './types';

export function gridDimensions(width: number, height: number, grid: GridSpec): { cols: number; rows: number } {
  const size = Math.max(4, grid.size);
  return {
    cols: Math.max(1, Math.ceil((width - grid.offsetX) / size)),
    rows: Math.max(1, Math.ceil((height - grid.offsetY) / size)),
  };
}

/** La casella sotto un punto (in pixel dell'immagine). */
export function cellAt(point: { x: number; y: number }, grid: GridSpec): Cell {
  const size = Math.max(4, grid.size);
  return { col: Math.floor((point.x - grid.offsetX) / size), row: Math.floor((point.y - grid.offsetY) / size) };
}

export function cellRect(cell: Cell, grid: GridSpec): { x: number; y: number; width: number; height: number } {
  return { x: grid.offsetX + cell.col * grid.size, y: grid.offsetY + cell.row * grid.size, width: grid.size, height: grid.size };
}

/**
 * Distanza in piedi fra due caselle — SRD 5.1: ogni casella vale 5 ft, **diagonali comprese**.
 * (La variante 5-10-5 è della Guida del DM, non dell'SRD.)
 */
export function distanceFeet(a: Cell, b: Cell): number {
  return 5 * Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

export const cellKey = (cell: Cell): string => `${cell.col},${cell.row}`;

export function clampCell(cell: Cell, dims: { cols: number; rows: number }): Cell {
  return {
    col: Math.min(dims.cols - 1, Math.max(0, cell.col)),
    row: Math.min(dims.rows - 1, Math.max(0, cell.row)),
  };
}

/** Tutte le caselle del rettangolo fra due angoli, in qualunque ordine siano stati trascinati. */
export function cellsInRect(a: Cell, b: Cell, dims: { cols: number; rows: number }): Cell[] {
  const from = clampCell({ col: Math.min(a.col, b.col), row: Math.min(a.row, b.row) }, dims);
  const to = clampCell({ col: Math.max(a.col, b.col), row: Math.max(a.row, b.row) }, dims);
  const cells: Cell[] = [];
  for (let row = from.row; row <= to.row; row++) {
    for (let col = from.col; col <= to.col; col++) cells.push({ col, row });
  }
  return cells;
}

export function revealRect(fog: readonly string[], a: Cell, b: Cell, dims: { cols: number; rows: number }): string[] {
  const set = new Set(fog);
  for (const cell of cellsInRect(a, b, dims)) set.add(cellKey(cell));
  return [...set];
}

export function coverRect(fog: readonly string[], a: Cell, b: Cell, dims: { cols: number; rows: number }): string[] {
  const set = new Set(fog);
  for (const cell of cellsInRect(a, b, dims)) set.delete(cellKey(cell));
  return [...set];
}

export function revealAll(dims: { cols: number; rows: number }): string[] {
  return cellsInRect({ col: 0, row: 0 }, { col: dims.cols - 1, row: dims.rows - 1 }, dims).map(cellKey);
}

/** Le caselle occupate da un segnalino di una certa taglia, dall'angolo in alto a sinistra. */
export function tokenCells(token: { col: number; row: number; size: number }): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < token.size; r++) for (let c = 0; c < token.size; c++) cells.push({ col: token.col + c, row: token.row + r });
  return cells;
}

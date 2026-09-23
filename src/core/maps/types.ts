/** ⚠ Modulo puro (invariante I1). */

export interface GridSpec {
  /** Lato di una casella, in pixel dell'immagine. */
  size: number;
  offsetX: number;
  offsetY: number;
}

export interface Cell {
  col: number;
  row: number;
}

export interface Token {
  id: string;
  label: string;
  color: string;
  col: number;
  row: number;
  /** Caselle per lato: 1 media, 2 grande, 3 enorme, 4 mastodontica. */
  size: number;
  /** Combattente del combat tracker a cui è legato, se c'è. */
  combatantId: string | null;
  hidden: boolean;
}

export interface Pin {
  id: string;
  /** Frazioni 0–1 dell'immagine: restano giuste anche se l'immagine cambia risoluzione. */
  x: number;
  y: number;
  label: string;
  /** Noto ai giocatori: solo questi arrivano nella Vista (SPEC-0013 AC5). */
  known: boolean;
}

export interface MapSpec {
  kind: 'battle' | 'world';
  imageUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  grid: GridSpec;
  showGrid: boolean;
  /** Caselle RIVELATE, "col,row". Una mappa nuova è tutta coperta. */
  fog: string[];
  tokens: Token[];
  pins: Pin[];
}

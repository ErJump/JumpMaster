import { describe, it, expect } from 'vitest';
import {
  cellAt,
  cellsInRect,
  coverRect,
  distanceFeet,
  gridDimensions,
  revealAll,
  revealRect,
  tokenCells,
  toPublicMap,
  type MapSpec,
  type Token,
} from './index';
import { reduceCombat } from '../events/combat-reduce';
import type { CombatEvent } from '../events/combat-types';

const grid = { size: 70, offsetX: 0, offsetY: 0 };
const dims = { cols: 10, rows: 8 };

describe('griglia', () => {
  it('calcola colonne e righe, arrotondando per eccesso i bordi', () => {
    expect(gridDimensions(700, 560, grid)).toStrictEqual({ cols: 10, rows: 8 });
    expect(gridDimensions(710, 560, grid)).toStrictEqual({ cols: 11, rows: 8 }); // bordo parziale
  });

  it('tiene conto dello scostamento', () => {
    expect(gridDimensions(700, 560, { size: 70, offsetX: 35, offsetY: 0 }).cols).toBe(10);
    expect(cellAt({ x: 40, y: 10 }, { size: 70, offsetX: 35, offsetY: 0 })).toStrictEqual({ col: 0, row: 0 });
    expect(cellAt({ x: 30, y: 10 }, { size: 70, offsetX: 35, offsetY: 0 })).toStrictEqual({ col: -1, row: 0 });
  });

  it('trova la casella sotto un punto', () => {
    expect(cellAt({ x: 0, y: 0 }, grid)).toStrictEqual({ col: 0, row: 0 });
    expect(cellAt({ x: 69, y: 70 }, grid)).toStrictEqual({ col: 0, row: 1 });
    expect(cellAt({ x: 145, y: 215 }, grid)).toStrictEqual({ col: 2, row: 3 });
  });
});

describe('distanceFeet — SRD 5.1', () => {
  it('5 ft per casella in linea retta', () => {
    expect(distanceFeet({ col: 0, row: 0 }, { col: 6, row: 0 })).toBe(30);
  });

  it('le diagonali valgono 5 ft come le altre caselle (non la variante 5-10-5 della Guida del DM)', () => {
    expect(distanceFeet({ col: 0, row: 0 }, { col: 4, row: 4 })).toBe(20);
    expect(distanceFeet({ col: 2, row: 1 }, { col: 5, row: 7 })).toBe(30); // max(3, 6) × 5
  });

  it('la stessa casella è a distanza zero', () => {
    expect(distanceFeet({ col: 3, row: 3 }, { col: 3, row: 3 })).toBe(0);
  });
});

describe('nebbia', () => {
  it('il rettangolo funziona in qualunque direzione lo si trascini', () => {
    expect(cellsInRect({ col: 2, row: 2 }, { col: 0, row: 0 }, dims)).toHaveLength(9);
  });

  it('non esce dai bordi della mappa', () => {
    expect(cellsInRect({ col: -5, row: -5 }, { col: 50, row: 50 }, dims)).toHaveLength(80);
  });

  it('rivela e copre senza doppioni', () => {
    let fog = revealRect([], { col: 0, row: 0 }, { col: 1, row: 1 }, dims);
    fog = revealRect(fog, { col: 1, row: 1 }, { col: 2, row: 1 }, dims);
    expect(fog.sort()).toStrictEqual(['0,0', '0,1', '1,0', '1,1', '2,1']);
    fog = coverRect(fog, { col: 1, row: 0 }, { col: 2, row: 1 }, dims);
    expect(fog.sort()).toStrictEqual(['0,0', '0,1']);
  });

  it('«rivela tutto» rivela ogni casella', () => {
    expect(revealAll(dims)).toHaveLength(80);
  });

  it('un segnalino grande occupa più caselle', () => {
    expect(tokenCells({ col: 3, row: 2, size: 2 })).toStrictEqual([
      { col: 3, row: 2 }, { col: 4, row: 2 }, { col: 3, row: 3 }, { col: 4, row: 3 },
    ]);
  });
});

describe('toPublicMap — ai giocatori arriva solo ciò che possono vedere', () => {
  const token = (id: string, label: string, col: number, row: number, extra: Partial<Token> = {}): Token => ({
    id, label, color: '#c00', col, row, size: 1, combatantId: null, hidden: false, ...extra,
  });

  const map: MapSpec = {
    kind: 'battle',
    imageUrl: '/api/uploads/x.png',
    imageWidth: 700,
    imageHeight: 560,
    grid,
    showGrid: true,
    fog: revealRect([], { col: 0, row: 0 }, { col: 3, row: 3 }, dims), // rivelato l'angolo 4×4
    tokens: [
      token('t1', 'Elara', 1, 1, { combatantId: 'pc1' }),
      token('t2', 'Goblin Nella Nebbia', 8, 6, { combatantId: 'g1' }),
      token('t3', 'Spia Nascosta', 2, 2, { hidden: true }),
      token('t4', 'Assassino Imboscato', 3, 0, { combatantId: 'spy' }),
      token('t5', 'Troll', 3, 3, { size: 2 }), // solo un quarto nella zona rivelata
    ],
    pins: [],
  };

  const events: CombatEvent[] = [
    { type: 'combatant-add', id: 'pc1', name: 'Elara', kind: 'pc', maxHp: 20, ac: 13, initiativeMod: 2, initiative: 15 },
    { type: 'combatant-add', id: 'g1', name: 'Goblin Nella Nebbia', kind: 'monster', maxHp: 7, ac: 15, initiativeMod: 2, initiative: 12 },
    { type: 'combatant-add', id: 'spy', name: 'Assassino Imboscato', kind: 'monster', maxHp: 78, ac: 15, initiativeMod: 4, initiative: 20 },
    { type: 'visibility-set', id: 'spy', hidden: true },
  ];
  const view = toPublicMap(map, reduceCombat(events));
  const json = JSON.stringify(view);

  it('il segnalino sotto la nebbia NON esiste nei dati inviati', () => {
    expect(json).not.toContain('Goblin Nella Nebbia');
  });

  it('il segnalino nascosto e quello del combattente nascosto non esistono', () => {
    expect(json).not.toContain('Spia Nascosta');
    expect(json).not.toContain('Assassino Imboscato');
  });

  it('non trapelano campi riservati', () => {
    expect(json).not.toMatch(/combatantId|"hidden"/);
  });

  it('un segnalino grande parzialmente rivelato si vede', () => {
    expect(view.kind === 'battle' && view.tokens.map((t) => t.label)).toStrictEqual(['Elara', 'Troll']);
  });

  it('il turno di un nascosto non si tradisce', () => {
    // L'assassino ha iniziativa 20 ed è di turno, ma è nascosto.
    expect(view.kind === 'battle' && view.turn).toBeNull();
    expect(view.kind === 'battle' && view.tokens.some((t) => t.active)).toBe(false);
  });

  it('segna il segnalino di chi è di turno', () => {
    const next = toPublicMap(map, reduceCombat([...events, { type: 'turn-next' }]));
    // L'assassino nascosto (iniziativa 20) è di turno; al turno successivo tocca a Elara (15).
    expect(next.kind === 'battle' && next.turn).toBe('Elara');
    const elara = next.kind === 'battle' ? next.tokens.find((t) => t.label === 'Elara') : undefined;
    expect(elara?.active).toBe(true);
  });

  it('segna i segnalini dei mostri morti, non quelli dei PG a terra', () => {
    const lit = { ...map, fog: revealAll(dims) };
    const next = toPublicMap(
      lit,
      reduceCombat([
        ...events,
        { type: 'damage', id: 'g1', amount: 99 },
        // 25 su 20 PF massimi: 5 di avanzo, sotto la soglia del danno massiccio (SRD).
        { type: 'damage', id: 'pc1', amount: 25 },
      ]),
    );
    const byLabel = (label: string) => (next.kind === 'battle' ? next.tokens.find((t) => t.label === label) : undefined);
    expect(byLabel('Goblin Nella Nebbia')?.dead).toBe(true);
    // Un PG a 0 PF è privo di sensi, non morto: il segnalino resta acceso.
    expect(byLabel('Elara')?.dead).toBe(false);
    expect(byLabel('Troll')?.dead).toBe(false);
  });
});

describe('toPublicMap — il turno non tradisce ciò che la nebbia nasconde', () => {
  // Caso reale emerso provando: il golem era sotto la nebbia, il suo segnalino giustamente non
  // arrivava ai giocatori, ma la Vista annunciava comunque «Tocca a Flesh Golem».
  const fogged: MapSpec = {
    kind: 'battle', imageUrl: null, imageWidth: 700, imageHeight: 560, grid, showGrid: true,
    fog: revealRect([], { col: 0, row: 0 }, { col: 3, row: 3 }, dims),
    tokens: [
      { id: 'tg', label: 'Flesh Golem', color: '#c00', col: 8, row: 6, size: 1, combatantId: 'golem', hidden: false },
      { id: 'te', label: 'Elara', color: '#0c0', col: 1, row: 1, size: 1, combatantId: 'pc1', hidden: false },
    ],
    pins: [],
  };
  const golemFirst: CombatEvent[] = [
    { type: 'combatant-add', id: 'golem', name: 'Flesh Golem', kind: 'monster', maxHp: 93, ac: 9, initiativeMod: -1, initiative: 18 },
    { type: 'combatant-add', id: 'pc1', name: 'Elara', kind: 'pc', maxHp: 20, ac: 13, initiativeMod: 2, initiative: 10 },
  ];

  it('se tocca a chi è sotto la nebbia, il turno non viene annunciato', () => {
    const view = toPublicMap(fogged, reduceCombat(golemFirst));
    expect(view.kind === 'battle' && view.turn).toBeNull();
    expect(JSON.stringify(view)).not.toContain('Golem');
  });

  it('rivelata la zona, il turno si annuncia', () => {
    const view = toPublicMap({ ...fogged, fog: revealAll(dims) }, reduceCombat(golemFirst));
    expect(view.kind === 'battle' && view.turn).toBe('Flesh Golem');
  });

  it('chi non ha un segnalino su questa mappa si annuncia normalmente', () => {
    const view = toPublicMap({ ...fogged, tokens: [] }, reduceCombat(golemFirst));
    expect(view.kind === 'battle' && view.turn).toBe('Flesh Golem');
  });
});

describe('toPublicMap — mappa del mondo', () => {
  it('arrivano solo i segnaposto noti ai giocatori', () => {
    const view = toPublicMap(
      {
        kind: 'world', imageUrl: null, imageWidth: 1000, imageHeight: 800, grid, showGrid: false, fog: [], tokens: [],
        pins: [
          { id: 'a', x: 0.2, y: 0.3, label: 'Vallaki', known: true },
          { id: 'b', x: 0.7, y: 0.1, label: 'Tana del Drago', known: false },
        ],
      },
      null,
    );
    expect(JSON.stringify(view)).not.toContain('Tana del Drago');
    expect(view.kind === 'world' && view.pins.map((p) => p.label)).toStrictEqual(['Vallaki']);
  });
});

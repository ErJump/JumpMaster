import { describe, it, expect } from 'vitest';
import { reduceCombat, currentCombatant } from './combat-reduce';
import type { CombatEvent } from './combat-types';

const add = (
  id: string,
  name: string,
  overrides: Partial<Extract<CombatEvent, { type: 'combatant-add' }>> = {},
): CombatEvent => ({
  type: 'combatant-add',
  id,
  name,
  kind: 'monster',
  maxHp: 10,
  ac: 12,
  initiativeMod: 0,
  ...overrides,
});

describe('reduceCombat — costruzione', () => {
  it('da nessun evento produce uno stato vuoto e coerente', () => {
    const state = reduceCombat([]);
    expect(state).toMatchObject({ started: false, round: 1, turnIndex: 0, combatants: [] });
  });

  it('aggiunge i combattenti con i punti ferita al massimo', () => {
    const state = reduceCombat([add('a', 'Goblin 1', { maxHp: 7 })]);
    expect(state.combatants[0]).toMatchObject({ name: 'Goblin 1', maxHp: 7, currentHp: 7, status: 'active' });
  });

  it('ignora un secondo inserimento con lo stesso identificativo', () => {
    const state = reduceCombat([add('a', 'Goblin 1'), add('a', 'Goblin 1')]);
    expect(state.combatants).toHaveLength(1);
  });
});

describe('reduceCombat — ordine di iniziativa', () => {
  it('ordina per iniziativa decrescente', () => {
    const state = reduceCombat([
      add('a', 'Lento', { initiative: 5 }),
      add('b', 'Veloce', { initiative: 20 }),
      add('c', 'Medio', { initiative: 12 }),
    ]);
    expect(state.combatants.map((c) => c.name)).toStrictEqual(['Veloce', 'Medio', 'Lento']);
  });

  it('a parità di iniziativa decide il modificatore', () => {
    const state = reduceCombat([
      add('a', 'Tardo', { initiative: 15, initiativeMod: 1 }),
      add('b', 'Destro', { initiative: 15, initiativeMod: 4 }),
    ]);
    expect(state.combatants.map((c) => c.name)).toStrictEqual(['Destro', 'Tardo']);
  });

  it('è DETERMINISTICO a parità totale: le righe non saltano fra una riduzione e l’altra', () => {
    const events = [
      add('a', 'Primo', { initiative: 10, initiativeMod: 2 }),
      add('b', 'Secondo', { initiative: 10, initiativeMod: 2 }),
      add('c', 'Terzo', { initiative: 10, initiativeMod: 2 }),
    ];
    const ordini = Array.from({ length: 5 }, () => reduceCombat(events).combatants.map((c) => c.id));
    for (const ordine of ordini) expect(ordine).toStrictEqual(['a', 'b', 'c']);
  });

  it('chi non ha ancora l’iniziativa finisce in fondo', () => {
    const state = reduceCombat([add('a', 'Senza'), add('b', 'Con', { initiative: 3 })]);
    expect(state.combatants.map((c) => c.name)).toStrictEqual(['Con', 'Senza']);
  });

  it('inserire l’iniziativa dopo riordina la lista', () => {
    const state = reduceCombat([
      add('a', 'Tardivo'),
      add('b', 'Pronto', { initiative: 8 }),
      { type: 'initiative-set', id: 'a', value: 19 },
    ]);
    expect(state.combatants.map((c) => c.name)).toStrictEqual(['Tardivo', 'Pronto']);
  });
});

describe('reduceCombat — turni e round', () => {
  const tre = [
    add('a', 'A', { initiative: 30 }),
    add('b', 'B', { initiative: 20 }),
    add('c', 'C', { initiative: 10 }),
  ];

  it('avanza lungo l’ordine di iniziativa', () => {
    expect(currentCombatant(reduceCombat(tre))?.name).toBe('A');
    expect(currentCombatant(reduceCombat([...tre, { type: 'turn-next' }]))?.name).toBe('B');
  });

  it('chiuso il giro comincia un nuovo round', () => {
    const state = reduceCombat([...tre, { type: 'turn-next' }, { type: 'turn-next' }, { type: 'turn-next' }]);
    expect(state.round).toBe(2);
    expect(currentCombatant(state)?.name).toBe('A');
  });

  it('tornare indietro dal primo riporta al round precedente', () => {
    const state = reduceCombat([...tre, { type: 'turn-prev' }]);
    expect(currentCombatant(state)?.name).toBe('C');
    expect(state.round).toBe(1); // non scende sotto 1
  });

  it('non va in errore senza combattenti', () => {
    expect(() => reduceCombat([{ type: 'turn-next' }])).not.toThrow();
  });

  it('rimuovere chi viene prima nel giro non sposta il turno sulla riga sbagliata', () => {
    // Turno su B; si toglie A, che veniva prima: il turno deve restare su B.
    const state = reduceCombat([...tre, { type: 'turn-next' }, { type: 'combatant-remove', id: 'a' }]);
    expect(currentCombatant(state)?.name).toBe('B');
  });
});

describe('reduceCombat — danno e cura', () => {
  const goblin = add('g', 'Goblin 1', { maxHp: 7, initiative: 12 });

  it('applica il danno e lo racconta nel registro', () => {
    const state = reduceCombat([goblin, { type: 'damage', id: 'g', amount: 4 }]);
    expect(state.combatants[0]?.currentHp).toBe(3);
    expect(state.log.some((entry) => entry.text.includes('subisce 4 danni'))).toBe(true);
  });

  it('un mostro a 0 muore', () => {
    const state = reduceCombat([goblin, { type: 'damage', id: 'g', amount: 9 }]);
    expect(state.combatants[0]?.status).toBe('dead');
  });

  it('un PG a 0 sveniva e la cura lo rimette in piedi', () => {
    const state = reduceCombat([
      add('p', 'Elara', { kind: 'pc', maxHp: 20, initiative: 15 }),
      { type: 'damage', id: 'p', amount: 25 },
      { type: 'heal', id: 'p', amount: 5 },
    ]);
    expect(state.combatants[0]).toMatchObject({ currentHp: 5, status: 'active' });
    expect(state.log.some((entry) => entry.text.includes('riprende conoscenza'))).toBe(true);
  });

  it('ignora eventi riferiti a combattenti inesistenti', () => {
    expect(() => reduceCombat([goblin, { type: 'damage', id: 'fantasma', amount: 5 }])).not.toThrow();
  });
});

describe('reduceCombat — concentrazione', () => {
  const mago = add('m', 'Elara', { kind: 'pc', maxHp: 30, initiative: 14 });

  it('mette in coda il tiro salvezza con la CD già calcolata', () => {
    const state = reduceCombat([
      mago,
      { type: 'concentration-set', id: 'm', spell: 'Ragnatela' },
      { type: 'damage', id: 'm', amount: 9 },
    ]);
    // CD = 10 oppure metà del danno, il maggiore → max(10, 4) = 10
    expect(state.pendingConcentration).toStrictEqual([
      { combatantId: 'm', combatantName: 'Elara', spell: 'Ragnatela', dc: 10 },
    ]);
  });

  it('con danni alti la CD sale a metà del danno', () => {
    const state = reduceCombat([
      mago,
      { type: 'concentration-set', id: 'm', spell: 'Volare' },
      { type: 'damage', id: 'm', amount: 27 },
    ]);
    expect(state.pendingConcentration[0]?.dc).toBe(13);
  });

  it('cadere a 0 fa perdere la concentrazione, senza tiro salvezza', () => {
    const state = reduceCombat([
      mago,
      { type: 'concentration-set', id: 'm', spell: 'Ragnatela' },
      { type: 'damage', id: 'm', amount: 30 },
    ]);
    expect(state.combatants[0]?.concentration).toBeNull();
    expect(state.pendingConcentration).toHaveLength(0);
    expect(state.log.some((entry) => entry.text.includes('perde la concentrazione'))).toBe(true);
  });

  it('il promemoria sparisce al cambio di turno', () => {
    const state = reduceCombat([
      mago,
      { type: 'concentration-set', id: 'm', spell: 'Ragnatela' },
      { type: 'damage', id: 'm', amount: 9 },
      { type: 'turn-next' },
    ]);
    expect(state.pendingConcentration).toHaveLength(0);
  });
});

describe('reduceCombat — condizioni', () => {
  it('aggiunge e toglie, senza duplicare', () => {
    const state = reduceCombat([
      add('a', 'Orco', { initiative: 10 }),
      { type: 'condition-add', id: 'a', condition: 'avvelenato' },
      { type: 'condition-add', id: 'a', condition: 'avvelenato' },
      { type: 'condition-add', id: 'a', condition: 'prono' },
      { type: 'condition-remove', id: 'a', condition: 'avvelenato' },
    ]);
    expect(state.combatants[0]?.conditions).toStrictEqual(['prono']);
  });
});

describe('reduceCombat — annulla', () => {
  const base: CombatEvent[] = [
    add('g', 'Goblin 1', { maxHp: 7, initiative: 12 }),
    { type: 'damage', id: 'g', amount: 4 },
  ];

  it('ridurre un evento in meno riporta esattamente allo stato precedente', () => {
    // È il cuore di ADR-0005: annullare = ridurre senza l'ultimo evento.
    const dopo = reduceCombat(base);
    const prima = reduceCombat(base.slice(0, -1));
    expect(dopo.combatants[0]?.currentHp).toBe(3);
    expect(prima.combatants[0]?.currentHp).toBe(7);
  });

  it('si può risalire il registro più volte di seguito', () => {
    const eventi: CombatEvent[] = [
      ...base,
      { type: 'damage', id: 'g', amount: 2 },
      { type: 'damage', id: 'g', amount: 1 },
    ];
    expect(reduceCombat(eventi).combatants[0]?.currentHp).toBe(0);
    expect(reduceCombat(eventi.slice(0, -1)).combatants[0]?.currentHp).toBe(1);
    expect(reduceCombat(eventi.slice(0, -2)).combatants[0]?.currentHp).toBe(3);
    expect(reduceCombat(eventi.slice(0, -3)).combatants[0]?.currentHp).toBe(7);
  });

  it('la riduzione è pura: gli stessi eventi danno sempre lo stesso stato', () => {
    expect(reduceCombat(base)).toStrictEqual(reduceCombat(base));
  });
});

describe('reduceCombat — un combattimento intero', () => {
  it('regge una sequenza realistica dall’inizio alla fine', () => {
    const state = reduceCombat([
      { type: 'combat-start' },
      add('elara', 'Elara', { kind: 'pc', maxHp: 24, ac: 15, initiativeMod: 3, initiative: 18 }),
      add('gorm', 'Gorm', { kind: 'pc', maxHp: 38, ac: 18, initiativeMod: 0, initiative: 11 }),
      add('g1', 'Goblin 1', { maxHp: 7, ac: 15, initiativeMod: 2, initiative: 14 }),
      add('g2', 'Goblin 2', { maxHp: 7, ac: 15, initiativeMod: 2, initiative: 9 }),
      { type: 'concentration-set', id: 'elara', spell: 'Ragnatela' },
      { type: 'condition-add', id: 'g1', condition: 'trattenuto' },
      { type: 'turn-next' },
      { type: 'damage', id: 'g1', amount: 9 },
      { type: 'turn-next' },
      { type: 'damage', id: 'elara', amount: 6 },
      { type: 'turn-next' },
      { type: 'damage', id: 'g2', amount: 7 },
      { type: 'turn-next' },
    ]);

    expect(state.started).toBe(true);
    expect(state.round).toBe(2);
    expect(state.combatants.map((c) => c.name)).toStrictEqual(['Elara', 'Goblin 1', 'Gorm', 'Goblin 2']);
    expect(state.combatants.find((c) => c.id === 'g1')?.status).toBe('dead');
    expect(state.combatants.find((c) => c.id === 'g2')?.status).toBe('dead');
    expect(state.combatants.find((c) => c.id === 'elara')?.currentHp).toBe(18);
    expect(state.log.length).toBeGreaterThan(5);
  });
});

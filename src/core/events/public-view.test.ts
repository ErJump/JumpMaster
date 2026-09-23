import { describe, it, expect } from 'vitest';
import { hpBand, toPublicCombat } from './public-view';
import { reduceCombat } from './combat-reduce';
import type { CombatEvent } from './combat-types';

describe('hpBand', () => {
  it('dà le cinque fasce ai confini giusti', () => {
    expect(hpBand(100, 100, 'active')).toBe('illeso');
    expect(hpBand(99, 100, 'active')).toBe('ferito');
    expect(hpBand(51, 100, 'active')).toBe('ferito');
    expect(hpBand(50, 100, 'active')).toBe('malconcio'); // la metà esatta è già malconcio
    expect(hpBand(26, 100, 'active')).toBe('malconcio');
    expect(hpBand(25, 100, 'active')).toBe('in-fin-di-vita');
    expect(hpBand(1, 100, 'active')).toBe('in-fin-di-vita');
    expect(hpBand(0, 100, 'active')).toBe('morto');
  });

  it('un morto è morto anche se i numeri dicessero altro', () => {
    expect(hpBand(5, 10, 'dead')).toBe('morto');
  });
});

/**
 * Numeri volutamente strani: se compaiono nel JSON, è quasi certamente una fuga di dati
 * e non una coincidenza.
 */
const scene: CombatEvent[] = [
  { type: 'combat-start' },
  { type: 'combatant-add', id: 'pc1', name: 'Elara', kind: 'pc', maxHp: 32, ac: 13, initiativeMod: 3, initiative: 16 },
  {
    type: 'combatant-add',
    id: 'boss',
    name: 'Troll delle Paludi',
    kind: 'monster',
    maxHp: 137,
    ac: 23,
    initiativeMod: 1,
    initiative: 12,
    srdMonsterSlug: 'troll',
  },
  { type: 'combatant-add', id: 'spy', name: 'Assassino Nascosto', kind: 'monster', maxHp: 78, ac: 19, initiativeMod: 4, initiative: 20 },
  { type: 'visibility-set', id: 'spy', hidden: true },
  { type: 'damage', id: 'boss', amount: 46 }, // 137 → 91
];

describe('toPublicCombat — nessun dato riservato arriva ai giocatori', () => {
  const view = toPublicCombat(reduceCombat(scene));
  const json = JSON.stringify(view);

  it('i PF esatti del mostro non compaiono da nessuna parte nel JSON', () => {
    // È ciò che viaggia davvero verso la finestra dei giocatori (SPEC-0008 AC7).
    expect(json).not.toContain('137');
    expect(json).not.toContain('91');
  });

  it('la Classe Armatura non compare', () => {
    expect(json).not.toContain('23');
    expect(json).not.toMatch(/"ac"/);
  });

  it('lo stat block non compare', () => {
    expect(json).not.toContain('troll"');
    expect(json).not.toMatch(/srdMonsterSlug/);
  });

  it('il mostro mostra solo la fascia', () => {
    const boss = view.combatants.find((c) => c.id === 'boss');
    expect(boss).toStrictEqual({
      id: 'boss',
      name: 'Troll delle Paludi',
      initiative: 12,
      conditions: [],
      concentration: null,
      status: 'active',
      kind: 'creature',
      band: 'ferito', // 91/137 ≈ 66%
    });
  });

  it('il PG mostra i suoi punti ferita esatti', () => {
    const pc = view.combatants.find((c) => c.id === 'pc1');
    expect(pc).toMatchObject({ kind: 'pc', currentHp: 32, maxHp: 32 });
  });

  it('il combattente nascosto non esiste nella vista, nemmeno per nome', () => {
    expect(json).not.toContain('Assassino');
    expect(json).not.toContain('spy');
    expect(json).not.toContain('78');
    expect(view.combatants).toHaveLength(2);
  });
});

describe('toPublicCombat — il turno di un nascosto non si tradisce', () => {
  it('se tocca a un nascosto, nessuna riga è evidenziata', () => {
    // L'assassino ha iniziativa 20: è il primo di turno, ma è nascosto.
    const view = toPublicCombat(reduceCombat(scene));
    expect(view.currentId).toBeNull();
  });

  it('rivelato, torna visibile e il suo turno si vede', () => {
    const view = toPublicCombat(reduceCombat([...scene, { type: 'visibility-set', id: 'spy', hidden: false }]));
    expect(view.currentId).toBe('spy');
    expect(view.combatants.map((c) => c.name)).toContain('Assassino Nascosto');
  });

  it('passato il turno, torna evidenziato chi è visibile', () => {
    const view = toPublicCombat(reduceCombat([...scene, { type: 'turn-next' }]));
    expect(view.currentId).toBe('pc1');
  });
});

describe('toPublicCombat — i PG a terra', () => {
  it('mostra i tiri salvezza contro morte', () => {
    const view = toPublicCombat(
      reduceCombat([
        ...scene,
        { type: 'damage', id: 'pc1', amount: 40 },
        { type: 'death-save', id: 'pc1', result: 'failure' },
      ]),
    );
    const pc = view.combatants.find((c) => c.id === 'pc1');
    expect(pc).toMatchObject({ status: 'unconscious', deathSaves: { successes: 0, failures: 1 } });
  });
});

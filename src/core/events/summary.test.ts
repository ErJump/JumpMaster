import { describe, it, expect } from 'vitest';
import { summarizeCombat } from './summary';
import { reduceCombat } from './combat-reduce';
import type { CombatEvent } from './combat-types';

const add = (id: string, name: string, kind: 'pc' | 'monster', maxHp: number, initiative: number): CombatEvent => ({
  type: 'combatant-add', id, name, kind, maxHp, ac: 12, initiativeMod: 0, initiative,
});

const battle: CombatEvent[] = [
  { type: 'combat-start' },
  add('elara', 'Elara', 'pc', 20, 18),
  add('gorm', 'Gorm', 'pc', 40, 10),
  add('g1', 'Goblin 1', 'monster', 7, 15),
  add('g2', 'Goblin 2', 'monster', 7, 12),
  add('g3', 'Goblin 3', 'monster', 7, 11),
  add('ogre', 'Ogre', 'monster', 59, 5),
  { type: 'damage', id: 'g1', amount: 10 },
  { type: 'damage', id: 'g2', amount: 10 },
  { type: 'damage', id: 'elara', amount: 25 }, // a terra…
  { type: 'heal', id: 'elara', amount: 6 }, //    …e rialzata
  { type: 'turn-next' }, { type: 'turn-next' }, { type: 'turn-next' }, { type: 'turn-next' },
];

describe('summarizeCombat', () => {
  const text = summarizeCombat(reduceCombat(battle), 'Imboscata sulla strada');

  it('mette il titolo dello scontro e i round', () => {
    expect(text).toContain('### Scontro: Imboscata sulla strada');
    expect(text).toContain('- 2 round.');
  });

  it('raggruppa i mostri numerati', () => {
    expect(text).toContain('- Sconfitti: 2 Goblin.');
    expect(text).toContain('- Ancora in piedi alla fine: Goblin, Ogre.');
  });

  it('ricorda chi è caduto e poi è stato rialzato, anche se alla fine sta bene', () => {
    // È il dettaglio che lo stato finale da solo perderebbe: serve `everDowned`.
    expect(text).toContain('- Caduti a terra e poi rialzati: Elara.');
    expect(text).not.toContain('Nessun personaggio è caduto');
  });

  it('segnala i morti in evidenza', () => {
    const tragic = summarizeCombat(
      reduceCombat([...battle, { type: 'damage', id: 'gorm', amount: 80 }]),
      'Fine di Gorm',
    );
    expect(tragic).toContain('- **Morti**: Gorm.');
  });

  it('se nessuno cade, lo dice', () => {
    const easy = summarizeCombat(
      reduceCombat([add('elara', 'Elara', 'pc', 20, 18), add('g1', 'Goblin', 'monster', 7, 10), { type: 'damage', id: 'g1', amount: 9 }]),
      'Facile',
    );
    expect(easy).toContain('- Nessun personaggio è caduto.');
    expect(easy).toContain('- 1 round.');
  });
});

import { describe, it, expect } from 'vitest';
import { applyDamage, applyHealing, applyTempHp, applyDeathSave } from './hit-points';
import type { Combatant } from './combat-types';

function pc(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'pc1',
    name: 'Elara',
    kind: 'pc',
    maxHp: 30,
    currentHp: 30,
    tempHp: 0,
    ac: 15,
    initiative: 12,
    initiativeMod: 2,
    conditions: [],
    concentration: null,
    deathSaves: { successes: 0, failures: 0 },
    status: 'active',
    hidden: false,
    ...overrides,
  };
}

const monster = (overrides: Partial<Combatant> = {}): Combatant =>
  pc({ id: 'm1', name: 'Goblin 1', kind: 'monster', maxHp: 7, currentHp: 7, ...overrides });

describe('applyDamage — punti ferita temporanei', () => {
  it('assorbono per primi', () => {
    const out = applyDamage(pc({ tempHp: 5 }), 3);
    expect(out.combatant.tempHp).toBe(2);
    expect(out.combatant.currentHp).toBe(30); // intatti
    expect(out.absorbedByTemp).toBe(3);
  });

  it('l’eccedenza passa ai punti ferita veri', () => {
    const out = applyDamage(pc({ tempHp: 5 }), 12);
    expect(out.combatant.tempHp).toBe(0);
    expect(out.combatant.currentHp).toBe(23); // 30 − 7
    expect(out.absorbedByTemp).toBe(5);
    expect(out.appliedToHp).toBe(7);
  });

  it('un colpo assorbito del tutto non tocca i punti ferita', () => {
    const out = applyDamage(pc({ tempHp: 10 }), 10);
    expect(out.combatant.tempHp).toBe(0);
    expect(out.combatant.currentHp).toBe(30);
    expect(out.appliedToHp).toBe(0);
  });
});

describe('applyTempHp', () => {
  it('NON si sommano: si tiene il valore più alto', () => {
    // La svista classica. Sommarli renderebbe i personaggi molto più resistenti del dovuto.
    expect(applyTempHp(pc({ tempHp: 5 }), 8).tempHp).toBe(8);
    expect(applyTempHp(pc({ tempHp: 8 }), 5).tempHp).toBe(8);
  });

  it('ignora valori non positivi', () => {
    expect(applyTempHp(pc({ tempHp: 5 }), 0).tempHp).toBe(5);
    expect(applyTempHp(pc({ tempHp: 5 }), -3).tempHp).toBe(5);
  });
});

describe('applyDamage — cadere a 0 punti ferita', () => {
  it('un PG sviene e comincia i tiri salvezza contro morte', () => {
    const out = applyDamage(pc({ currentHp: 5 }), 8);
    expect(out.combatant.currentHp).toBe(0);
    expect(out.combatant.status).toBe('unconscious');
    expect(out.combatant.deathSaves).toStrictEqual({ successes: 0, failures: 0 });
    expect(out.droppedToZero).toBe(true);
  });

  it('i punti ferita non vanno mai sotto zero', () => {
    expect(applyDamage(pc({ currentHp: 5 }), 8).combatant.currentHp).toBe(0);
  });

  it('cadere a 0 fa perdere la concentrazione', () => {
    const concentrato = pc({ currentHp: 3, concentration: { spell: 'Ragnatela' } });
    expect(applyDamage(concentrato, 5).combatant.concentration).toBeNull();
  });

  it('un mostro muore a 0 senza tiri salvezza', () => {
    const out = applyDamage(monster({ currentHp: 3 }), 5);
    expect(out.combatant.status).toBe('dead');
  });
});

describe('applyDamage — danno massiccio', () => {
  it('uccide all’istante se il danno residuo eguaglia i punti ferita massimi', () => {
    // 30 PF massimi, a 5 PF, subisce 35: residuo 30 ≥ 30 → morte istantanea.
    const out = applyDamage(pc({ currentHp: 5 }), 35);
    expect(out.combatant.status).toBe('dead');
    expect(out.instantDeath).toBe(true);
  });

  it('un punto in meno e invece sviene soltanto', () => {
    // Il confine deve essere esatto: residuo 29 < 30 → svenimento.
    const out = applyDamage(pc({ currentHp: 5 }), 34);
    expect(out.combatant.status).toBe('unconscious');
    expect(out.instantDeath).toBe(false);
  });

  it('vale anche per chi è già a terra', () => {
    const out = applyDamage(pc({ currentHp: 0, status: 'unconscious' }), 30);
    expect(out.combatant.status).toBe('dead');
    expect(out.instantDeath).toBe(true);
  });
});

describe('applyDamage — colpito mentre si è a 0 punti ferita', () => {
  const down = pc({ currentHp: 0, status: 'unconscious' });

  it('un colpo qualunque costa un fallimento', () => {
    const out = applyDamage(down, 3);
    expect(out.combatant.deathSaves.failures).toBe(1);
    expect(out.combatant.status).toBe('unconscious');
  });

  it('un colpo critico ne costa due', () => {
    const out = applyDamage(down, 3, { critical: true });
    expect(out.combatant.deathSaves.failures).toBe(2);
  });

  it('al terzo fallimento si muore', () => {
    const out = applyDamage(pc({ currentHp: 0, status: 'unconscious', deathSaves: { successes: 1, failures: 2 } }), 3);
    expect(out.combatant.status).toBe('dead');
  });

  it('un critico su chi ha già un fallimento uccide', () => {
    const out = applyDamage(
      pc({ currentHp: 0, status: 'unconscious', deathSaves: { successes: 0, failures: 1 } }),
      3,
      { critical: true },
    );
    expect(out.combatant.status).toBe('dead');
    expect(out.combatant.deathSaves.failures).toBe(3);
  });
});

describe('applyDamage — casi degeneri', () => {
  it('danno nullo o negativo non cambia nulla', () => {
    const before = pc({ currentHp: 20 });
    expect(applyDamage(before, 0).combatant).toBe(before);
    expect(applyDamage(before, -5).combatant).toBe(before);
  });

  it('un morto non subisce altro danno', () => {
    const morto = pc({ currentHp: 0, status: 'dead' });
    expect(applyDamage(morto, 100).combatant).toBe(morto);
  });
});

describe('applyHealing', () => {
  it('cura senza superare i punti ferita massimi', () => {
    expect(applyHealing(pc({ currentHp: 25 }), 10).combatant.currentHp).toBe(30);
  });

  it('una cura da 0 riporta coscienza e AZZERA i tiri salvezza contro morte', () => {
    const down = pc({ currentHp: 0, status: 'unconscious', deathSaves: { successes: 1, failures: 2 } });
    const out = applyHealing(down, 4);
    expect(out.combatant.currentHp).toBe(4);
    expect(out.combatant.status).toBe('active');
    expect(out.combatant.deathSaves).toStrictEqual({ successes: 0, failures: 0 });
    expect(out.revived).toBe(true);
  });

  it('anche un solo punto ferita rimette in piedi', () => {
    const down = pc({ currentHp: 0, status: 'unconscious' });
    expect(applyHealing(down, 1).combatant.status).toBe('active');
  });

  it('un morto non si cura con la magia ordinaria', () => {
    const morto = pc({ currentHp: 0, status: 'dead' });
    expect(applyHealing(morto, 20).combatant).toBe(morto);
  });

  it('cure nulle o negative non cambiano nulla', () => {
    const before = pc({ currentHp: 10 });
    expect(applyHealing(before, 0).combatant).toBe(before);
  });
});

describe('applyDeathSave', () => {
  const down = pc({ currentHp: 0, status: 'unconscious' });

  it('accumula successi e fallimenti', () => {
    expect(applyDeathSave(down, 'success').combatant.deathSaves.successes).toBe(1);
    expect(applyDeathSave(down, 'failure').combatant.deathSaves.failures).toBe(1);
  });

  it('tre successi stabilizzano', () => {
    const quasi = pc({ currentHp: 0, status: 'unconscious', deathSaves: { successes: 2, failures: 1 } });
    const out = applyDeathSave(quasi, 'success');
    expect(out.combatant.status).toBe('stable');
    expect(out.stabilized).toBe(true);
  });

  it('tre fallimenti uccidono', () => {
    const quasi = pc({ currentHp: 0, status: 'unconscious', deathSaves: { successes: 1, failures: 2 } });
    const out = applyDeathSave(quasi, 'failure');
    expect(out.combatant.status).toBe('dead');
    expect(out.died).toBe(true);
  });

  it('un 1 naturale vale due fallimenti', () => {
    expect(applyDeathSave(down, 'critical-failure').combatant.deathSaves.failures).toBe(2);
  });

  it('un 1 naturale su un fallimento già presente uccide', () => {
    const quasi = pc({ currentHp: 0, status: 'unconscious', deathSaves: { successes: 0, failures: 1 } });
    expect(applyDeathSave(quasi, 'critical-failure').combatant.status).toBe('dead');
  });

  it('un 20 naturale rimette in piedi con 1 punto ferita: non stabilizza soltanto', () => {
    const out = applyDeathSave(down, 'critical-success');
    expect(out.combatant.currentHp).toBe(1);
    expect(out.combatant.status).toBe('active');
    expect(out.revivedByNatural20).toBe(true);
    expect(out.combatant.deathSaves).toStrictEqual({ successes: 0, failures: 0 });
  });

  it('chi non è privo di sensi non tira i salvezza contro morte', () => {
    const inPiedi = pc({ currentHp: 20 });
    expect(applyDeathSave(inPiedi, 'failure').combatant).toBe(inPiedi);
    const stabile = pc({ currentHp: 0, status: 'stable' });
    expect(applyDeathSave(stabile, 'failure').combatant).toBe(stabile);
  });
});

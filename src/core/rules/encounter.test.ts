import { describe, it, expect } from 'vitest';
import {
  actionEconomyFactor,
  partyBenchmarkXp,
  difficultyFromRatio,
  evaluateEncounter,
  DIFFICULTY_INFO,
} from './encounter';

describe('actionEconomyFactor', () => {
  it('non altera nulla con un mostro solo', () => {
    expect(actionEconomyFactor(1)).toBe(1);
    expect(actionEconomyFactor(0)).toBe(1);
  });

  it('cresce di circa un quarto a ogni raddoppio', () => {
    expect(actionEconomyFactor(2)).toBeCloseTo(1.27, 2);
    expect(actionEconomyFactor(4)).toBeCloseTo(1.62, 2);
    expect(actionEconomyFactor(8)).toBeCloseTo(2.07, 2);
    expect(actionEconomyFactor(16)).toBeCloseTo(2.64, 2);
  });

  it('cresce in modo regolare, senza salti fra un mostro e il successivo', () => {
    // Il motivo per cui usiamo una curva e non una tabella a scalini: passare da 6 a 7
    // mostri non può far scattare la difficoltà di un quarto.
    for (let n = 1; n < 30; n++) {
      const delta = actionEconomyFactor(n + 1) - actionEconomyFactor(n);
      expect(delta).toBeGreaterThanOrEqual(0);
      expect(delta).toBeLessThan(0.3);
    }
  });
});

describe('partyBenchmarkXp', () => {
  it('per un gruppo di quattro vale i PE di un mostro di GS pari al livello', () => {
    // È l'ancoraggio del modello: GS = livello è uno scontro equo per quattro avventurieri.
    expect(partyBenchmarkXp(5, 4)).toBe(1800); // crToXp(5)
    expect(partyBenchmarkXp(1, 4)).toBe(200);
    expect(partyBenchmarkXp(10, 4)).toBe(5900);
  });

  it('scala sulla dimensione reale del gruppo', () => {
    expect(partyBenchmarkXp(5, 2)).toBe(900); // metà gruppo, metà riferimento
    expect(partyBenchmarkXp(5, 6)).toBe(2700);
  });

  it('limita i livelli fuori scala invece di restituire zero', () => {
    expect(partyBenchmarkXp(0, 4)).toBe(200); // trattato come livello 1
    expect(partyBenchmarkXp(25, 4)).toBe(25000); // trattato come livello 20
  });
});

describe('difficultyFromRatio', () => {
  it('assegna le fasce nell’ordine giusto', () => {
    expect(difficultyFromRatio(0.2)).toBe('banale');
    expect(difficultyFromRatio(0.6)).toBe('facile');
    expect(difficultyFromRatio(1.0)).toBe('impegnativo');
    expect(difficultyFromRatio(1.8)).toBe('duro');
    expect(difficultyFromRatio(5)).toBe('letale');
  });

  it('le fasce sono monotone: più alto il rapporto, mai più facile', () => {
    const order = ['banale', 'facile', 'impegnativo', 'duro', 'letale'];
    let previous = -1;
    for (let r = 0; r < 6; r += 0.05) {
      const index = order.indexOf(difficultyFromRatio(r));
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
  });
});

describe('evaluateEncounter — casi reali al tavolo', () => {
  const party = (level: number, size = 4) => ({ level, size });

  it('un mostro di GS pari al livello è uno scontro impegnativo', () => {
    // L'ancoraggio del modello deve reggere: e' la promessa fatta in ADR-0008.
    const result = evaluateEncounter([{ xp: 1800, count: 1 }], party(5));
    expect(result.ratio).toBe(1);
    expect(result.difficulty).toBe('impegnativo');
  });

  it('quattro goblin contro un gruppo di livello 1 sono duri, come da fama', () => {
    // 4 × 50 PE = 200, fattore 1.62 → 324 contro un riferimento di 200.
    const result = evaluateEncounter([{ xp: 50, count: 4 }], party(1));
    expect(result.difficulty).toBe('duro');
  });

  it('un mostro molto sopra il livello del gruppo è letale', () => {
    const result = evaluateEncounter([{ xp: 5000, count: 1 }], party(5)); // GS 9
    expect(result.difficulty).toBe('letale');
  });

  it('mostri molto sotto livello sono banali', () => {
    const result = evaluateEncounter([{ xp: 25, count: 2 }], party(10));
    expect(result.difficulty).toBe('banale');
  });

  it('a parità di PE totali, più mostri = più pericolo', () => {
    const uno = evaluateEncounter([{ xp: 800, count: 1 }], party(5));
    const otto = evaluateEncounter([{ xp: 100, count: 8 }], party(5));
    expect(uno.totalXp).toBe(otto.totalXp);
    expect(otto.effectiveXp).toBeGreaterThan(uno.effectiveXp);
  });

  it('un gruppo più numeroso regge di più lo stesso scontro', () => {
    const monsters = [{ xp: 1800, count: 1 }];
    const quattro = evaluateEncounter(monsters, party(5, 4));
    const sei = evaluateEncounter(monsters, party(5, 6));
    expect(sei.ratio).toBeLessThan(quattro.ratio);
  });

  it('restituisce tutti i passaggi del calcolo, non solo il verdetto', () => {
    // SPEC-0006 AC2: nessun numero senza spiegazione.
    const result = evaluateEncounter([{ xp: 100, count: 4 }], party(3));
    expect(result).toMatchObject({ monsterCount: 4, totalXp: 400 });
    expect(result.actionFactor).toBeGreaterThan(1);
    expect(result.effectiveXp).toBe(Math.round(400 * result.actionFactor));
    expect(result.benchmarkXp).toBeGreaterThan(0);
  });
});

describe('evaluateEncounter — casi degeneri', () => {
  it('senza gruppo non inventa un verdetto', () => {
    const result = evaluateEncounter([{ xp: 1800, count: 1 }], { level: 5, size: 0 });
    expect(result.hasParty).toBe(false);
    expect(result.difficulty).toBeNull();
    expect(result.totalXp).toBe(1800); // i PE li conta comunque
  });

  it('senza mostri non dà una difficoltà', () => {
    expect(evaluateEncounter([], { level: 5, size: 4 }).difficulty).toBeNull();
  });

  it('ignora le quantità negative invece di sottrarre PE', () => {
    const result = evaluateEncounter([{ xp: 100, count: -3 }], { level: 5, size: 4 });
    expect(result.totalXp).toBe(0);
    expect(result.monsterCount).toBe(0);
  });
});

describe('DIFFICULTY_INFO', () => {
  it('ogni fascia dice cosa aspettarsi, non solo un’etichetta', () => {
    for (const info of Object.values(DIFFICULTY_INFO)) {
      expect(info.label.trim()).not.toBe('');
      expect(info.expect.length).toBeGreaterThan(30);
    }
  });
});

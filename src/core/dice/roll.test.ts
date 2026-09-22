import { describe, it, expect } from 'vitest';
import { parseDice } from './parse';
import { rollExpression, roll, type Rng } from './roll';
import { formatRoll } from './format';

/**
 * Generatore deterministico: restituisce i valori indicati, uno per chiamata.
 * `valuesOf([18, 7], 20)` → il primo d20 esce 18, il secondo 7.
 */
function fixedDice(values: number[], faces: number): Rng {
  let i = 0;
  return () => {
    const value = values[i++] ?? values[values.length - 1] ?? 1;
    return (value - 1) / faces; // Math.floor(rng()*faces)+1 === value
  };
}

const rollWith = (notation: string, values: number[], faces: number) =>
  rollExpression(parseDice(notation), fixedDice(values, faces));

describe('rollExpression — totali', () => {
  it('somma i dadi e il modificatore', () => {
    const result = rollWith('2d6+3', [4, 5], 6);
    expect(result.terms[0]?.dice.map((d) => d.value)).toStrictEqual([4, 5]);
    expect(result.total).toBe(12);
  });

  it('sottrae i termini negativi', () => {
    expect(rollWith('1d6-2', [5], 6).total).toBe(3);
  });

  it('divide arrotondando per difetto (danno dimezzato su TS riuscito)', () => {
    // 8d6 tutti a 5 = 40 → 20
    expect(rollWith('8d6/2', [5], 6).total).toBe(20);
    // 3d6 tutti a 3 = 9 → 4, non 4.5 né 5
    expect(rollWith('3d6/2', [3], 6).total).toBe(4);
  });
});

describe('rollExpression — tieni e scarta', () => {
  it('4d6kh3 scarta il dado più basso', () => {
    const result = rollWith('4d6kh3', [6, 1, 4, 5], 6);
    const dice = result.terms[0]!.dice;
    expect(dice.map((d) => d.value)).toStrictEqual([6, 1, 4, 5]); // ordine di uscita preservato
    expect(dice.map((d) => d.kept)).toStrictEqual([true, false, true, true]);
    expect(result.total).toBe(15);
  });

  it('2d20kh1 è il vantaggio: tiene il più alto', () => {
    const result = rollWith('2d20kh1', [7, 18], 20);
    expect(result.terms[0]!.dice.map((d) => d.kept)).toStrictEqual([false, true]);
    expect(result.total).toBe(18);
  });

  it('2d20kl1 è lo svantaggio: tiene il più basso', () => {
    const result = rollWith('2d20kl1', [7, 18], 20);
    expect(result.terms[0]!.dice.map((d) => d.kept)).toStrictEqual([true, false]);
    expect(result.total).toBe(7);
  });

  it('4d6dl1 scarta il più basso', () => {
    expect(rollWith('4d6dl1', [2, 6, 6, 6], 6).total).toBe(18);
  });

  it('4d6dh1 scarta il più alto', () => {
    expect(rollWith('4d6dh1', [2, 2, 2, 6], 6).total).toBe(6);
  });

  it('a parità di valore scarta un dado solo, non entrambi', () => {
    const result = rollWith('2d20kh1', [15, 15], 20);
    expect(result.terms[0]!.dice.filter((d) => d.kept)).toHaveLength(1);
    expect(result.total).toBe(15);
  });
});

describe('rollExpression — 20 e 1 naturali', () => {
  it('segnala il 20 naturale su un d20', () => {
    const result = rollWith('1d20+5', [20], 20);
    expect(result.natural20).toBe(true);
    expect(result.natural1).toBe(false);
    expect(result.total).toBe(25);
  });

  it('segnala l’1 naturale', () => {
    expect(rollWith('1d20', [1], 20).natural1).toBe(true);
  });

  it('NON segnala un 20 che è stato scartato', () => {
    // Con svantaggio, un 20 scartato non è un critico.
    const result = rollWith('2d20kl1', [20, 3], 20);
    expect(result.natural20).toBe(false);
    expect(result.total).toBe(3);
  });

  it('non confonde un 20 su un d100 con un 20 naturale', () => {
    expect(rollWith('1d100', [20], 100).natural20).toBe(false);
  });
});

describe('formatRoll', () => {
  it('mostra i singoli dadi, con gli scartati barrati', () => {
    expect(formatRoll(rollWith('2d20kh1+5', [18, 7], 20))).toBe('2d20kh1 [18, ~~7~~] +5 = 23');
  });

  it('mostra il divisore', () => {
    expect(formatRoll(rollWith('2d6/2', [3, 3], 6))).toBe('2d6 [3, 3] / 2 = 3');
  });
});

describe('roll — integrazione', () => {
  it('analizza e lancia in un colpo solo', () => {
    expect(roll('2d6+1', fixedDice([4, 4], 6)).total).toBe(9);
  });

  it('con il generatore reale resta nell’intervallo possibile', () => {
    for (let i = 0; i < 300; i++) {
      const total = roll('3d6+2').total;
      expect(total).toBeGreaterThanOrEqual(5); // 3×1 + 2
      expect(total).toBeLessThanOrEqual(20); // 3×6 + 2
    }
  });

  it('un d20 reale produce solo valori fra 1 e 20', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(roll('1d20').total);
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...seen)).toBeLessThanOrEqual(20);
    expect(seen.size).toBeGreaterThan(15); // copre praticamente tutte le facce
  });
});

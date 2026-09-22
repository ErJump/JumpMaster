import { describe, it, expect } from 'vitest';
import { parseDice, DiceParseError, MAX_DICE, MAX_FACES } from './parse';

describe('parseDice — notazione valida', () => {
  it('legge un tiro semplice e sottintende la quantità 1', () => {
    expect(parseDice('d20').terms).toStrictEqual([
      { kind: 'dice', sign: 1, count: 1, faces: 20, keep: null },
    ]);
    expect(parseDice('3d6').terms[0]).toMatchObject({ count: 3, faces: 6 });
  });

  it('legge i modificatori positivi e negativi', () => {
    expect(parseDice('1d20+5').terms).toHaveLength(2);
    expect(parseDice('1d20+5').terms[1]).toStrictEqual({ kind: 'constant', sign: 1, value: 5 });
    expect(parseDice('2d6-1').terms[1]).toStrictEqual({ kind: 'constant', sign: -1, value: 1 });
  });

  it('legge tieni e scarta', () => {
    expect(parseDice('4d6kh3').terms[0]).toMatchObject({ keep: { mode: 'kh', count: 3 } });
    expect(parseDice('2d20kh1').terms[0]).toMatchObject({ keep: { mode: 'kh', count: 1 } });
    expect(parseDice('2d20kl1').terms[0]).toMatchObject({ keep: { mode: 'kl', count: 1 } });
    expect(parseDice('4d6dl1').terms[0]).toMatchObject({ keep: { mode: 'dl', count: 1 } });
    expect(parseDice('4d6dh1').terms[0]).toMatchObject({ keep: { mode: 'dh', count: 1 } });
  });

  it('sottintende 1 quando la quantità di tieni/scarta è omessa', () => {
    expect(parseDice('2d20kh').terms[0]).toMatchObject({ keep: { mode: 'kh', count: 1 } });
  });

  it('legge il divisore del danno dimezzato', () => {
    const expr = parseDice('8d6/2');
    expect(expr.divisor).toBe(2);
    expect(expr.terms[0]).toMatchObject({ count: 8, faces: 6 });
  });

  it('legge più termini di dadi nello stesso tiro', () => {
    expect(parseDice('2d8+1d6+3').terms).toHaveLength(3);
  });

  it('tratta d% come d100', () => {
    expect(parseDice('d%').terms[0]).toMatchObject({ faces: 100 });
    expect(parseDice('d100').terms[0]).toMatchObject({ faces: 100 });
  });

  it('ignora spazi e maiuscole', () => {
    expect(parseDice('  2D20 KH1 + 5 ').notation).toBe('2d20kh1+5');
  });

  it('accetta un segno iniziale', () => {
    expect(parseDice('-1d4').terms[0]).toMatchObject({ sign: -1, count: 1, faces: 4 });
  });

  it('normalizza la notazione', () => {
    expect(parseDice('d20').notation).toBe('1d20');
    expect(parseDice('4D6KH3').notation).toBe('4d6kh3');
    expect(parseDice('8d6 / 2').notation).toBe('8d6/2');
  });
});

describe('parseDice — input non valido', () => {
  const rejects = (input: string) => expect(() => parseDice(input)).toThrow(DiceParseError);

  it('rifiuta la stringa vuota', () => {
    rejects('');
    rejects('   ');
  });

  it('rifiuta testo che non è un tiro', () => {
    rejects('ciao');
    rejects('d');
    rejects('1d');
    rejects('1d20+');
    rejects('1d20@3');
  });

  it('rifiuta dadi impossibili', () => {
    rejects('1d1');
    rejects('1d0');
    rejects('0d6');
  });

  it('rifiuta i numeri fuori scala invece di far esplodere il browser', () => {
    rejects(`${MAX_DICE + 1}d6`);
    rejects(`1d${MAX_FACES + 1}`);
  });

  it('rifiuta la divisione per zero', () => {
    rejects('8d6/0');
  });

  it('rifiuta tieni/scarta senza senso', () => {
    rejects('2d20kh5'); // tenerne 5 su 2 non farebbe nulla
    rejects('2d6dl2'); // scartarne 2 su 2 non lascerebbe niente
    rejects('4d6kh0');
  });

  it('scrive messaggi in italiano', () => {
    expect(() => parseDice('')).toThrow(/Scrivi un tiro/);
    expect(() => parseDice('8d6/0')).toThrow(/dividere per zero/);
    expect(() => parseDice('200d6')).toThrow(/Troppi dadi/);
  });
});

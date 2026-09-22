import { describe, it, expect } from 'vitest';
import { withAdvantage, acceptsAdvantage } from './advantage';

describe('withAdvantage', () => {
  it('trasforma il d20 iniziale, lasciando stare il resto', () => {
    expect(withAdvantage('1d20+5', 'advantage')).toBe('2d20kh1+5');
    expect(withAdvantage('1d20+5', 'disadvantage')).toBe('2d20kl1+5');
    expect(withAdvantage('d20', 'advantage')).toBe('2d20kh1');
  });

  it('non tocca nulla in modalità normale', () => {
    expect(withAdvantage('1d20+5', 'normal')).toBe('1d20+5');
  });

  it('NON duplica i dadi di danno: il vantaggio vale solo sul d20', () => {
    // Sarebbe un errore di regole, non un dettaglio estetico.
    expect(withAdvantage('2d6+3', 'advantage')).toBe('2d6+3');
    expect(withAdvantage('8d6', 'advantage')).toBe('8d6');
  });

  it('non scambia d200 per d20', () => {
    expect(withAdvantage('1d200', 'advantage')).toBe('1d200');
  });

  it('ignora maiuscole e spazi iniziali', () => {
    expect(withAdvantage('  D20+3', 'advantage')).toBe('2d20kh1+3');
  });

  it('non tocca un d20 che non è il primo termine', () => {
    // Con vantaggio si ritira il tiro per colpire, non un dado aggiunto al danno.
    expect(withAdvantage('2d6+1d20', 'advantage')).toBe('2d6+1d20');
  });
});

describe('acceptsAdvantage', () => {
  it('riconosce i tiri che possono ricevere vantaggio', () => {
    expect(acceptsAdvantage('1d20+5')).toBe(true);
    expect(acceptsAdvantage('d20')).toBe(true);
    expect(acceptsAdvantage('2d6+3')).toBe(false);
    expect(acceptsAdvantage('')).toBe(false);
  });
});

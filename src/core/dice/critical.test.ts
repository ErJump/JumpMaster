import { describe, it, expect } from 'vitest';
import { criticalDamage } from './critical';

describe('criticalDamage', () => {
  it('raddoppia i dadi ma NON il modificatore', () => {
    // L'errore classico è 2d6+4: il modificatore si somma una volta sola.
    expect(criticalDamage('1d6+2')).toBe('2d6+2');
    expect(criticalDamage('2d6+5')).toBe('4d6+5');
  });

  it('raddoppia ogni termine di dadi, anche quelli aggiuntivi', () => {
    // Es. un attacco che fa taglienti più fuoco.
    expect(criticalDamage('1d8+3+1d6')).toBe('2d8+3+2d6');
  });

  it('lascia intatti i modificatori negativi', () => {
    expect(criticalDamage('1d4-1')).toBe('2d4-1');
  });

  it('funziona anche con un solo dado senza modificatore', () => {
    expect(criticalDamage('1d12')).toBe('2d12');
    expect(criticalDamage('d10')).toBe('2d10');
  });
});

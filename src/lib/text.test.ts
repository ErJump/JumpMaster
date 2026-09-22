import { describe, it, expect } from 'vitest';
import { normalizeForSearch, matchesSearch } from './text';

describe('normalizeForSearch', () => {
  it('abbassa le maiuscole e toglie gli accenti', () => {
    expect(normalizeForSearch('Perché')).toBe('perche');
    expect(normalizeForSearch('ABOLETH')).toBe('aboleth');
    expect(normalizeForSearch('Città')).toBe('citta');
  });
});

describe('matchesSearch', () => {
  it('trova a prescindere da accenti e maiuscole', () => {
    expect(matchesSearch('Percezione passiva', 'PERCEZIONE')).toBe(true);
    expect(matchesSearch('Indebolimento', 'indeb')).toBe(true);
    expect(matchesSearch('Perché', 'perche')).toBe(true);
  });

  it('una ricerca vuota combacia sempre', () => {
    expect(matchesSearch('qualunque cosa', '')).toBe(true);
  });

  it('non trova ciò che non c’è', () => {
    expect(matchesSearch('Aboleth', 'drago')).toBe(false);
  });
});

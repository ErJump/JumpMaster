import { describe, it, expect } from 'vitest';
import { findTerm, expandQuery, GLOSSARY } from './glossary';

describe('findTerm', () => {
  it('trova per nome inglese o italiano, ignorando le maiuscole', () => {
    expect(findTerm('Prone')?.it).toBe('Prono');
    expect(findTerm('prono')?.en).toBe('Prone');
    expect(findTerm('PRONE')?.it).toBe('Prono');
  });

  it('restituisce undefined per termini che non esistono', () => {
    expect(findTerm('bistecca')).toBeUndefined();
  });
});

describe('expandQuery', () => {
  it('aggiunge il corrispondente inglese a una ricerca italiana', () => {
    // Il problema reale: l'SRD chiama "Cover" quella che il DM cerca come "copertura".
    expect(expandQuery('copertura')).toContain('Cover');
    expect(expandQuery('prono')).toContain('Prone');
    expect(expandQuery('furtività')).toContain('Stealth');
  });

  it('funziona anche su una parola parziale', () => {
    expect(expandQuery('avvelen')).toContain('Poisoned');
  });

  it('ignora gli accenti', () => {
    expect(expandQuery('furtivita')).toContain('Stealth');
  });

  it('toglie le parentesi esplicative dal termine inglese', () => {
    // "Armor Class (AC)" cercato così com'è non combacerebbe col testo delle regole.
    expect(expandQuery('classe armatura')).toContain('Armor Class');
  });

  it('conserva SEMPRE la ricerca originale: espandere non toglie mai risultati', () => {
    expect(expandQuery('aboleth')).toStrictEqual(['aboleth']);
    expect(expandQuery('copertura')[0]).toBe('copertura');
  });

  it('non espande ricerche troppo corte, che combacerebbero con troppo', () => {
    expect(expandQuery('a')).toStrictEqual(['a']);
  });

  it('può restituire più corrispondenti quando l’italiano è ambiguo', () => {
    // "Forza" è sia la caratteristica (Strength) sia il tipo di danno (Force).
    const expanded = expandQuery('forza');
    expect(expanded).toContain('Strength');
    expect(expanded).toContain('Force');
  });
});

describe('GLOSSARY', () => {
  it('non ha termini inglesi duplicati', () => {
    const seen = GLOSSARY.map((term) => term.en);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('ha traduzione italiana per ogni voce', () => {
    for (const term of GLOSSARY) {
      expect(term.it.trim()).not.toBe('');
      expect(term.en.trim()).not.toBe('');
    }
  });
});

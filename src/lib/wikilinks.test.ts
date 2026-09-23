import { describe, it, expect } from 'vitest';
import { extractLinks, linkKey, linksTo, renameLinks, resolveLinkIn } from './wikilinks';

describe('linkKey', () => {
  it('ignora maiuscole, accenti e spazi in più', () => {
    expect(linkKey('Città di Vallaki')).toBe(linkKey('  citta   di VALLAKI '));
  });
});

describe('extractLinks', () => {
  it('trova i collegamenti semplici e quelli con etichetta', () => {
    expect(extractLinks('Si va a [[Vallaki]], poi alla [[Rocca di Ravenloft|rocca]].')).toStrictEqual([
      'Vallaki',
      'Rocca di Ravenloft',
    ]);
  });

  it('non duplica lo stesso luogo scritto in modi diversi', () => {
    expect(extractLinks('[[Vallaki]] e ancora [[vallaki]] e [[VALLAKI|il borgo]]')).toStrictEqual(['Vallaki']);
  });

  it('ignora parentesi incomplete e collegamenti vuoti', () => {
    expect(extractLinks('[[ ]] [Vallaki] [[Vallaki] testo')).toStrictEqual([]);
  });

  it('un testo senza collegamenti non ne ha', () => {
    expect(extractLinks('Solo testo.')).toStrictEqual([]);
  });
});

describe('linksTo', () => {
  it('riconosce una citazione a prescindere dalla grafia', () => {
    expect(linksTo('Vedi [[Città di Vallaki|la città]]', 'citta di vallaki')).toBe(true);
    expect(linksTo('Vedi [[Barovia]]', 'Vallaki')).toBe(false);
  });
});

describe('renameLinks', () => {
  it('riscrive i collegamenti alla nota rinominata', () => {
    expect(renameLinks('Vai a [[Vallaki]].', 'Vallaki', 'Borgo di Vallaki')).toBe('Vai a [[Borgo di Vallaki]].');
  });

  it("conserva l'etichetta scelta dall'autore", () => {
    expect(renameLinks('[[Vallaki|il borgo]]', 'Vallaki', 'Borgo di Vallaki')).toBe('[[Borgo di Vallaki|il borgo]]');
  });

  it('riconosce anche le grafie diverse del vecchio titolo', () => {
    expect(renameLinks('[[vallaki]] e [[VALLAKI]]', 'Vallaki', 'Borgo')).toBe('[[Borgo]] e [[Borgo]]');
  });

  it('non tocca gli altri collegamenti', () => {
    expect(renameLinks('[[Vallaki]] e [[Barovia]]', 'Vallaki', 'Borgo')).toBe('[[Borgo]] e [[Barovia]]');
  });
});

describe('resolveLinkIn', () => {
  const targets = {
    notes: [{ id: 7, title: 'Villaggio di Barovia' }],
    characters: [
      { id: 3, name: 'Ismark Kolyanovich' },
      { id: 9, name: 'Villaggio di Barovia' }, // omonimo: vince la nota
    ],
  };

  it('porta alla nota, anche con grafia diversa', () => {
    expect(resolveLinkIn(targets, 'villaggio di barovia')).toStrictEqual({ href: '/note/7', missing: false });
  });

  it('se non c\u2019è una nota, porta al personaggio', () => {
    expect(resolveLinkIn(targets, 'Ismark Kolyanovich')).toStrictEqual({ href: '/personaggi/3', missing: false });
  });

  it('se non esiste nulla, propone di creare la nota col titolo già scritto', () => {
    expect(resolveLinkIn(targets, 'Vallaki')).toStrictEqual({ href: '/note/nuova?titolo=Vallaki', missing: true });
  });

  it('codifica il titolo nell\u2019indirizzo', () => {
    expect(resolveLinkIn(targets, 'Torre & Pozzo').href).toBe('/note/nuova?titolo=Torre%20%26%20Pozzo');
  });
});

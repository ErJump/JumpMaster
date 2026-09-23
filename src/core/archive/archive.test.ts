import { describe, it, expect } from 'vitest';
import { archiveFileName, importedName, remapCharacterId } from './index';

describe('archiveFileName', () => {
  const day = new Date('2026-09-23T21:30:00Z');

  it('nome leggibile, senza accenti né spazi', () => {
    expect(archiveFileName('La Maledizione di Strahd', day)).toBe('jumpmaster-la-maledizione-di-strahd-2026-09-23.json');
    expect(archiveFileName('Città perduta: capitolo II', day)).toBe('jumpmaster-citta-perduta-capitolo-ii-2026-09-23.json');
  });

  it('un nome senza lettere diventa «campagna»', () => {
    expect(archiveFileName('⚔️ ???', day)).toBe('jumpmaster-campagna-2026-09-23.json');
  });

  it('i nomi lunghissimi si accorciano senza lasciare trattini in coda', () => {
    const name = archiveFileName(`${'a'.repeat(59)} bbbb`, day);
    expect(name).toBe(`jumpmaster-${'a'.repeat(59)}-2026-09-23.json`);
  });
});

describe('importedName', () => {
  it('se il nome è libero resta com’è', () => {
    expect(importedName('Strahd', ['Tomb of Annihilation'])).toBe('Strahd');
  });

  it('non crea mai un doppione, nemmeno cambiando maiuscole', () => {
    expect(importedName('Strahd', ['strahd'])).toBe('Strahd (importata)');
    expect(importedName('Strahd', ['Strahd', 'Strahd (importata)'])).toBe('Strahd (importata 2)');
    expect(importedName('Strahd', ['Strahd', 'Strahd (importata)', 'Strahd (importata 2)'])).toBe('Strahd (importata 3)');
  });
});

describe('remapCharacterId', () => {
  const ids = new Map([[3, 41]]);

  it('riscrive il personaggio con il nuovo identificativo', () => {
    expect(remapCharacterId({ type: 'combatant-add', id: 'pc-3', characterId: 3 }, ids)).toStrictEqual({
      type: 'combatant-add',
      id: 'pc-3',
      characterId: 41,
    });
  });

  it('toglie il collegamento a un personaggio che non è nel file', () => {
    expect(remapCharacterId({ id: 'pc-9', characterId: 9 }, ids)).toStrictEqual({ id: 'pc-9' });
  });

  it('lascia intatti gli eventi senza personaggio', () => {
    const event = { type: 'damage', id: 'm-7-1', amount: 5 };
    expect(remapCharacterId(event, ids)).toBe(event);
  });
});

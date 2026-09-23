import { describe, it, expect } from 'vitest';
import { fetchCatalog, fetchDocument, OPEN5E_API, Open5eError, type Fetch } from './api';

const doc = (key: string, gamesystem = '5e-2014') => ({
  key,
  name: `Book ${key}`,
  publisher: { key: 'pub', name: 'Publisher' },
  gamesystem: { key: gamesystem, name: gamesystem },
  licenses: [{ key: 'ogl-10a', name: 'OPEN GAME LICENSE Version 1.0a' }],
  permalink: 'https://example.com',
});

const creature = (key: string) => ({
  key,
  name: key,
  document: { key: key.split('_')[0] },
  size: { key: 'medium', name: 'Medium' },
  type: { key: 'beast', name: 'Beast' },
  alignment: 'unaligned',
  armor_class: 12,
  hit_points: 10,
  speed: { walk: 30 },
  ability_scores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 2, wisdom: 10, charisma: 4 },
  challenge_rating: 0.5,
  experience_points: 100,
});

/** Un finto Open5e: risponde agli URL che conosce, 404 al resto. Tiene nota delle chiamate. */
function fakeApi(routes: Record<string, unknown>) {
  const calls: string[] = [];
  const fetchImpl: Fetch = async (url) => {
    calls.push(url);
    if (!(url in routes)) return new Response('not found', { status: 404 });
    return Response.json(routes[url]);
  };
  return { fetchImpl, calls };
}

describe('fetchDocument', () => {
  it('scarica tutte le pagine seguendo `next` e riferisce l’avanzamento', async () => {
    const page2 = `${OPEN5E_API}/creatures/?document__key=bk&limit=100&page=2`;
    const { fetchImpl } = fakeApi({
      [`${OPEN5E_API}/documents/bk/`]: doc('bk'),
      [`${OPEN5E_API}/licenses/ogl-10a/`]: { key: 'ogl-10a', name: 'OGL', desc: 'The following text…' },
      [`${OPEN5E_API}/creatures/?document__key=bk&limit=100`]: { count: 3, next: page2, results: [creature('bk_a'), creature('bk_b')] },
      [page2]: { count: 3, next: null, results: [creature('bk_c')] },
    });
    const progress: Array<[number, number]> = [];

    const result = await fetchDocument(fetchImpl, 'bk', (received, total) => progress.push([received, total]));
    expect(result.creatures.map((c) => c.key)).toStrictEqual(['bk_a', 'bk_b', 'bk_c']);
    expect(result.licenses[0]?.desc).toBe('The following text…');
    expect(progress).toStrictEqual([
      [2, 3],
      [3, 3],
    ]);
  });

  it('rifiuta i manuali di un altro regolamento e quelli esclusi', async () => {
    const { fetchImpl } = fakeApi({
      [`${OPEN5E_API}/documents/srd-2024/`]: doc('srd-2024', '5e-2024'),
      [`${OPEN5E_API}/documents/srd-2014/`]: doc('srd-2014'),
    });
    await expect(fetchDocument(fetchImpl, 'srd-2024')).rejects.toThrow(Open5eError);
    await expect(fetchDocument(fetchImpl, 'srd-2014')).rejects.toThrow(/non è fra i manuali/);
  });

  it('una rete che cade diventa un messaggio in italiano', async () => {
    const offline: Fetch = async () => {
      throw new TypeError('fetch failed');
    };
    await expect(fetchDocument(offline, 'bk')).rejects.toThrow('Open5e non risponde: controlla la connessione e riprova.');
  });

  it('una risposta malformata non passa', async () => {
    const { fetchImpl } = fakeApi({
      [`${OPEN5E_API}/documents/bk/`]: doc('bk'),
      [`${OPEN5E_API}/licenses/ogl-10a/`]: { key: 'ogl-10a', name: 'OGL', desc: '…' },
      [`${OPEN5E_API}/creatures/?document__key=bk&limit=100`]: { count: 1, next: null, results: [{ key: 'bk_x', name: 'X' }] },
    });
    await expect(fetchDocument(fetchImpl, 'bk')).rejects.toThrow(/dati che l’app non riconosce/);
  });

  it('un’API che rimanda sempre alla stessa pagina non blocca l’app', async () => {
    const url = `${OPEN5E_API}/creatures/?document__key=bk&limit=100`;
    const { fetchImpl, calls } = fakeApi({
      [`${OPEN5E_API}/documents/bk/`]: doc('bk'),
      [`${OPEN5E_API}/licenses/ogl-10a/`]: { key: 'ogl-10a', name: 'OGL', desc: '…' },
      [url]: { count: 1, next: url, results: [] },
    });
    await fetchDocument(fetchImpl, 'bk');
    expect(calls.filter((c) => c === url).length).toBe(200);
  });
});

describe('fetchCatalog', () => {
  it('solo regolamento 2014, niente SRD né manuali sostituiti, niente manuali senza mostri', async () => {
    const count = (key: string, n: number) => ({
      [`${OPEN5E_API}/creatures/?document__key=${key}&limit=1&fields=key`]: { count: n, next: null, results: [] },
    });
    const { fetchImpl } = fakeApi({
      [`${OPEN5E_API}/documents/?gamesystem__key=5e-2014&limit=100`]: {
        count: 5,
        next: null,
        results: [doc('tob2'), doc('tob'), doc('srd-2014'), doc('spells'), doc('a5e-mm', 'a5e')],
      },
      ...count('tob2', 383),
      ...count('spells', 0),
    });

    const catalog = await fetchCatalog(fetchImpl);
    expect(catalog.map((c) => [c.document.key, c.monsterCount])).toStrictEqual([['tob2', 383]]);
  });
});

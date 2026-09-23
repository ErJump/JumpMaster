/** Installazione dei manuali Open5e su un database SQLite vero (SPEC-0015 AC6–AC8). */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import type Database from 'better-sqlite3';
import { openDatabase } from '@/db/open';
import * as schema from '@/db/schema';
import { creatureSchema, type DownloadedDocument } from '@/content/open5e/api';
import { documentUsage, installDocument, removeDocument, type SourcesDb } from './install';

const { monsters, open5eDocuments, open5eLicenses, open5eMonsters, campaigns, encounters, encounterMonsters, characters } = schema;

let dir: string;
let connection: Database.Database;
let db: SourcesDb;

const creature = (key: string, name: string) =>
  creatureSchema.parse({
    key,
    name,
    document: { key: key.split('_')[0] },
    size: { key: 'medium', name: 'Medium' },
    type: { key: 'beast', name: 'Beast' },
    alignment: 'unaligned',
    armor_class: 13,
    hit_points: 22,
    hit_dice: '4d8+4',
    speed: { walk: 40 },
    ability_scores: { strength: 14, dexterity: 15, constitution: 12, intelligence: 3, wisdom: 12, charisma: 6 },
    challenge_rating: 1,
    experience_points: 200,
  });

const book = (key: string, names: string[], licenses = ['ogl-10a']): DownloadedDocument => ({
  document: {
    key,
    name: `Book ${key}`,
    publisher: { key: 'kp', name: 'Kobold Press' },
    gamesystem: { key: '5e-2014', name: '5th Edition 2014' },
    licenses: licenses.map((l) => ({ key: l, name: l.toUpperCase() })),
    permalink: 'https://example.com/book',
  },
  licenses: licenses.map((l) => ({ key: l, name: l.toUpperCase(), desc: `Testo della licenza ${l}` })),
  creatures: names.map((name) => creature(`${key}_${name.toLowerCase().replace(/ /g, '-')}`, name)),
});

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'jumpmaster-sources-'));
  connection = openDatabase(join(dir, 'test.db'));
  db = drizzle(connection, { schema, casing: 'snake_case' });
  // Un mostro «SRD» finto: la vista deve unire le due fonti.
  connection.exec(`INSERT INTO srd_monsters (slug, name, size, type, alignment, cr, cr_label, xp, ac, hp, data)
    VALUES ('wolf', 'Wolf', 'Medium', 'beast', 'unaligned', 0.25, '¼', 50, 13, 11, '{}')`);
});

afterAll(() => {
  connection.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('installare un manuale', () => {
  it('i mostri compaiono nella vista accanto a quelli SRD, con la loro fonte', () => {
    expect(installDocument(db, book('tob2', ['Swamp Adder', 'Ash Drake']))).toBe(2);
    const all = db.select({ slug: monsters.slug, source: monsters.source, crLabel: monsters.crLabel }).from(monsters).all();
    expect(all).toStrictEqual([
      { slug: 'wolf', source: 'srd', crLabel: '¼' },
      { slug: 'tob2_swamp-adder', source: 'tob2', crLabel: '1' },
      { slug: 'tob2_ash-drake', source: 'tob2', crLabel: '1' },
    ]);
    expect(db.select().from(open5eLicenses).all()).toStrictEqual([{ key: 'ogl-10a', name: 'OGL-10A', text: 'Testo della licenza ogl-10a' }]);
  });

  it('riscaricare sostituisce, senza doppioni (AC7)', () => {
    installDocument(db, book('tob2', ['Swamp Adder', 'Clockwork Hound']));
    const slugs = db.select({ slug: open5eMonsters.slug }).from(open5eMonsters).where(eq(open5eMonsters.documentKey, 'tob2')).all();
    expect(slugs.map((s) => s.slug).sort()).toStrictEqual(['tob2_clockwork-hound', 'tob2_swamp-adder']);
    expect(db.select().from(open5eDocuments).all()).toHaveLength(1);
  });

  it('se la scrittura fallisce a metà, il manuale di prima resta intatto (AC8)', () => {
    const before = db.select().from(open5eMonsters).all();
    // Due creature con la stessa chiave: la seconda viola la chiave primaria dentro la transazione.
    const broken = book('tob2', ['Swamp Adder', 'Swamp Adder', 'Brand New']);
    expect(() => installDocument(db, broken)).toThrow();
    expect(db.select().from(open5eMonsters).all()).toStrictEqual(before);
  });
});

describe('rimuovere un manuale (AC6)', () => {
  it('prima dice quanto è usato, dopo gli scontri restano giocabili', () => {
    installDocument(db, book('ccdx', ['Mire Hag'], ['ogl-10a', 'cc-by-40']));
    const campaign = db.insert(campaigns).values({ name: 'Prova' }).returning().get();
    const encounter = db.insert(encounters).values({ campaignId: campaign.id, name: 'Nella palude' }).returning().get();
    db.insert(encounterMonsters)
      .values({ encounterId: encounter.id, srdMonsterSlug: 'ccdx_mire-hag', count: 1, name: 'Mire Hag', cr: '1', xp: 200, hp: 22, ac: 13 })
      .run();
    db.insert(characters).values({ campaignId: campaign.id, kind: 'npc', name: 'La strega', srdMonsterSlug: 'ccdx_mire-hag' }).run();

    expect(documentUsage(db, 'ccdx')).toStrictEqual({ encounters: 1, characters: 1 });
    expect(documentUsage(db, 'tob2')).toStrictEqual({ encounters: 0, characters: 0 });

    removeDocument(db, 'ccdx');
    expect(db.select().from(open5eMonsters).where(eq(open5eMonsters.documentKey, 'ccdx')).all()).toStrictEqual([]);
    // La copia dei numeri nello scontro resta: lo scontro si gioca ancora.
    expect(db.select().from(encounterMonsters).all()).toHaveLength(1);
    // La licenza usata solo da quel manuale se ne va; quella condivisa con tob2 resta.
    expect(db.select({ key: open5eLicenses.key }).from(open5eLicenses).all()).toStrictEqual([{ key: 'ogl-10a' }]);
  });
});

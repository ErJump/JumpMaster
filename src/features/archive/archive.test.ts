/**
 * Giro completo dell'archivio su un database SQLite **vero** (SPEC-0014 AC4–AC6): migrazioni reali,
 * file reali in una cartella temporanea. Niente finti: è proprio il punto in cui un finto
 * nasconderebbe l'errore.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { asc, eq, getTableColumns } from 'drizzle-orm';
import type Database from 'better-sqlite3';
import { openDatabase } from '@/db/open';
import * as schema from '@/db/schema';
import { reduceCombat, type CombatEvent } from '@/core/events';
import { detectImageType } from '@/lib/image-type';
import { exportCampaign, importCampaign, type ArchiveDb, type ImageStore } from './archive';
import { archiveSchema, describeArchiveError, type CampaignArchiveJson } from './schema';

const { campaigns, characters, notes, sessions, encounters, encounterMonsters, combatEvents, handouts, maps } = schema;

/** PNG 1×1 vero: il controllo sui byte deve riconoscerlo. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

let dir: string;
let uploads: string;
let connection: Database.Database;
let db: ArchiveDb;
let images: ImageStore;
let sourceId: number;

function fileStore(folder: string): ImageStore {
  return {
    async read(name) {
      return readFile(join(folder, name)).catch(() => null);
    },
    async save(bytes) {
      const type = detectImageType(bytes);
      if (!type) return null;
      const name = `${randomUUID()}.${type.ext}`;
      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, name), bytes);
      return name;
    },
    async remove(name) {
      await unlink(join(folder, name)).catch(() => undefined);
    },
  };
}

/** Il file come lo riceverebbe l'app: passato per il testo, poi per lo schema. */
function throughFile(archive: CampaignArchiveJson) {
  return archiveSchema.parse(JSON.parse(JSON.stringify(archive)));
}

async function seed(): Promise<number> {
  const at = (iso: string) => new Date(iso);
  const campaign = db
    .insert(campaigns)
    .values({
      name: 'La Maledizione di Strahd',
      description: 'Nebbie, lupi e un conte.',
      setting: 'Barovia',
      dmNotes: 'Strahd sa già tutto.',
      partyLevel: 3,
      sessionCount: 2,
      status: 'active',
      createdAt: at('2026-01-10T20:00:00Z'),
      updatedAt: at('2026-02-01T20:00:00Z'),
    })
    .returning()
    .get();
  const campaignId = campaign.id;

  // Un personaggio di un'altra campagna prima di questi: gli identificativi non partono da 1,
  // così un errore di rimappatura non passa inosservato per coincidenza.
  const other = db.insert(campaigns).values({ name: 'Altra campagna' }).returning().get();
  db.insert(characters).values({ campaignId: other.id, kind: 'pc', name: 'Estraneo' }).run();

  const elara = db
    .insert(characters)
    .values({
      campaignId,
      kind: 'pc',
      name: 'Elara Ventoluna',
      playerName: 'Giulia',
      className: 'Wizard',
      subclass: 'School of Evocation',
      race: 'Elf',
      level: 3,
      ac: 12,
      maxHp: 18,
      speed: 35,
      str: 8,
      dex: 14,
      con: 13,
      int: 17,
      wis: 12,
      cha: 11,
      saveProficiencies: ['int', 'wis'],
      skillProficiencies: ['arcana', 'history'],
      skillExpertise: ['arcana'],
      notes: 'Ha paura dei lupi.',
    })
    .returning()
    .get();
  db.insert(characters)
    .values({
      campaignId,
      kind: 'npc',
      name: 'Ismark',
      role: 'fratello del borgomastro',
      location: 'Villaggio di Barovia',
      disposition: 'friendly',
      appearance: 'Alto, stanco, con la spada del padre.',
      voice: 'Parla piano, sospira spesso.',
      secret: 'Vuole fuggire.',
      srdMonsterSlug: 'veteran',
      archived: true,
    })
    .run();

  db.insert(notes).values({ campaignId, title: 'Villaggio di Barovia', kind: 'place', body: 'Qui vive [[Ismark]].' }).run();
  db.insert(sessions)
    .values({
      campaignId,
      number: 1,
      title: 'Nelle nebbie',
      playedOn: '2026-01-17',
      prep: {
        characters: '',
        strongStart: 'I lupi ululano.',
        scenes: [{ id: 's1', text: 'La taverna' }],
        secrets: [{ id: 'x1', text: 'Ireena è la reincarnazione di Tatyana.', revealed: false }],
        locations: [],
        npcs: [],
        monsters: [],
        rewards: [],
      },
      journal: 'Il gruppo è arrivato.',
    })
    .run();

  const encounter = db
    .insert(encounters)
    .values({ campaignId, name: 'Lupi nella nebbia', description: 'Sulla strada.', notes: 'Fuggono sotto metà PF.', status: 'running' }).returning().get();
  const wolf = db
    .insert(encounterMonsters)
    .values({ encounterId: encounter.id, srdMonsterSlug: 'wolf', count: 2, name: 'Wolf', cr: '1/4', xp: 50, hp: 11, ac: 13, initiativeMod: 2, hitDice: '2d8+2' })
    .returning()
    .get();

  const events: Array<{ event: CombatEvent; setup?: true; undone?: boolean }> = [
    { event: { type: 'combat-start' }, setup: true },
    { event: { type: 'combatant-add', id: `pc-${elara.id}`, name: elara.name, kind: 'pc', maxHp: 18, ac: 12, initiativeMod: 2, characterId: elara.id }, setup: true },
    { event: { type: 'combatant-add', id: `m-${wolf.id}-1`, name: 'Wolf 1', kind: 'monster', maxHp: 11, ac: 13, initiativeMod: 2, initiative: 15, srdMonsterSlug: 'wolf' }, setup: true },
    { event: { type: 'combatant-add', id: `m-${wolf.id}-2`, name: 'Wolf 2', kind: 'monster', maxHp: 11, ac: 13, initiativeMod: 2, initiative: 9, srdMonsterSlug: 'wolf' }, setup: true },
    { event: { type: 'visibility-set', id: `m-${wolf.id}-2`, hidden: true } },
    { event: { type: 'initiative-set', id: `pc-${elara.id}`, value: 12 } },
    { event: { type: 'damage', id: `m-${wolf.id}-1`, amount: 7, source: 'Magic Missile' } },
    { event: { type: 'damage', id: `pc-${elara.id}`, amount: 30 }, undone: true },
    { event: { type: 'turn-next' } },
  ];
  db.insert(combatEvents)
    .values(
      events.map(({ event, setup, undone }, index) => ({
        encounterId: encounter.id,
        seq: index + 1,
        type: event.type,
        payload: setup ? { ...event, setup } : event,
        undoneAt: undone ? at('2026-02-01T21:00:00Z') : null,
      })),
    )
    .run();

  const handoutImage = await images.save(PNG);
  const mapImage = await images.save(PNG);
  db.insert(handouts).values({ campaignId, title: 'Lettera di Kolyan', body: 'Aiutateci.', imageFile: handoutImage }).run();
  db.insert(handouts).values({ campaignId, title: 'Solo testo', imageFile: null }).run();
  db.insert(maps)
    .values({
      campaignId,
      name: 'La strada nella nebbia',
      kind: 'battle',
      imageFile: mapImage,
      imageWidth: 700,
      imageHeight: 560,
      gridSize: 70,
      gridOffsetX: 12,
      gridOffsetY: 7,
      fog: ['0,0', '1,0'],
      tokens: [
        { id: 't1', label: 'Elara Ventoluna', color: '#4c9a72', col: 1, row: 0, size: 1, combatantId: `pc-${elara.id}`, hidden: false },
        { id: 't2', label: 'Wolf 1', color: '#c1485b', col: 4, row: 3, size: 1, combatantId: `m-${wolf.id}-1`, hidden: false },
      ],
    })
    .run();
  db.insert(maps)
    .values({
      campaignId,
      name: 'Barovia',
      kind: 'world',
      imageFile: mapImage,
      showGrid: false,
      pins: [
        { id: 'p1', x: 0.25, y: 0.5, label: 'Villaggio di Barovia', known: true },
        { id: 'p2', x: 0.8, y: 0.2, label: 'Castello di Ravenloft', known: false },
      ],
    })
    .run();

  return campaignId;
}

/**
 * Due esportazioni sono «lo stesso contenuto» se coincidono tolti ciò che l'import cambia per
 * forza: data di esportazione, nome della campagna, identificativi e nomi dei file immagine.
 */
function comparable(archive: CampaignArchiveJson) {
  const refs = new Map(archive.characters.map((c, index) => [c.ref, index]));
  // Un'immagine si confronta per contenuto: il nome sul disco cambia per forza.
  const content = (name: string | null) => (name === null ? null : archive.files[name]);
  return {
    ...archive,
    exportedAt: null,
    campaign: { ...archive.campaign, name: null },
    characters: archive.characters.map((c) => ({ ...c, ref: refs.get(c.ref) })),
    encounters: archive.encounters.map((e) => ({
      ...e,
      events: e.events.map((ev) => {
        const payload = ev.payload as { characterId?: number };
        return payload.characterId === undefined ? ev : { ...ev, payload: { ...payload, characterId: refs.get(payload.characterId) } };
      }),
    })),
    handouts: archive.handouts.map((h) => ({ ...h, imageFile: content(h.imageFile) })),
    maps: archive.maps.map((m) => ({ ...m, imageFile: content(m.imageFile) })),
    // Il contenuto delle immagini, non quante copie ne esistono.
    files: [...new Set(Object.values(archive.files))].sort(),
  };
}

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'jumpmaster-archive-'));
  uploads = join(dir, 'uploads');
  connection = openDatabase(join(dir, 'test.db'));
  db = drizzle(connection, { schema, casing: 'snake_case' });
  images = fileStore(uploads);
  sourceId = await seed();
});

afterAll(() => {
  connection.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('archivio di una campagna — giro completo', () => {
  it('esporta tutto, immagini comprese, e il file supera il proprio schema', async () => {
    const archive = await exportCampaign(db, sourceId, images);
    expect(archive).not.toBeNull();
    const parsed = throughFile(archive!);
    expect(parsed.characters.map((c) => c.name)).toStrictEqual(['Elara Ventoluna', 'Ismark']);
    expect(parsed.encounters[0]?.events).toHaveLength(9);
    // Un'immagine usata da due mappe viaggia una volta sola.
    expect(Object.keys(parsed.files)).toHaveLength(2);
  });

  it('ogni colonna di ogni tabella viaggia nel file', async () => {
    // Se una migrazione aggiunge una colonna e l'archivio non la conosce, questo test lo dice.
    const archive = (await exportCampaign(db, sourceId, images))!;
    const columns = (table: Parameters<typeof getTableColumns>[0], without: string[]) =>
      Object.keys(getTableColumns(table)).filter((c) => !without.includes(c)).sort();
    const keys = (row: object | undefined, without: string[] = []) => Object.keys(row ?? {}).filter((k) => !without.includes(k)).sort();

    expect(keys(archive.campaign)).toStrictEqual(columns(campaigns, ['id']));
    expect(keys(archive.characters[0], ['ref'])).toStrictEqual(columns(characters, ['id', 'campaignId']));
    expect(keys(archive.notes[0])).toStrictEqual(columns(notes, ['id', 'campaignId']));
    expect(keys(archive.sessions[0])).toStrictEqual(columns(sessions, ['id', 'campaignId']));
    expect(keys(archive.encounters[0], ['monsters', 'events'])).toStrictEqual(columns(encounters, ['id', 'campaignId']));
    expect(keys(archive.encounters[0]?.monsters[0])).toStrictEqual(columns(encounterMonsters, ['id', 'encounterId']));
    expect(keys(archive.encounters[0]?.events[0])).toStrictEqual(columns(combatEvents, ['id', 'encounterId']));
    expect(keys(archive.handouts[0])).toStrictEqual(columns(handouts, ['id', 'campaignId']));
    expect(keys(archive.maps[0])).toStrictEqual(columns(maps, ['id', 'campaignId']));
  });

  it('esportare → importare → esportare dà lo stesso contenuto (AC4)', async () => {
    const first = (await exportCampaign(db, sourceId, images))!;
    const result = await importCampaign(db, throughFile(first), images);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const second = (await exportCampaign(db, result.id, images))!;
    expect(comparable(second)).toStrictEqual(comparable(first));
  });

  it('crea una campagna nuova senza toccare l’originale, con un nome distinto (AC3)', async () => {
    const before = db.select().from(campaigns).orderBy(asc(campaigns.id)).all();
    const result = await importCampaign(db, throughFile((await exportCampaign(db, sourceId, images))!), images);
    expect(result.ok && result.name).toBe('La Maledizione di Strahd (importata 2)');

    const after = db.select().from(campaigns).orderBy(asc(campaigns.id)).all();
    expect(after.slice(0, before.length)).toStrictEqual(before);
    expect(after).toHaveLength(before.length + 1);
  });

  it('il combattimento in corso riprende da dove era, legato ai personaggi nuovi (AC5)', async () => {
    const result = await importCampaign(db, throughFile((await exportCampaign(db, sourceId, images))!), images);
    if (!result.ok) throw new Error(result.error);

    const state = (campaignId: number) => {
      const encounter = db.select().from(encounters).where(eq(encounters.campaignId, campaignId)).get()!;
      const rows = db.select().from(combatEvents).where(eq(combatEvents.encounterId, encounter.id)).orderBy(asc(combatEvents.seq)).all();
      // Il flag `setup` è del registro, non dell'evento: il riduttore non lo conosce.
      const active = rows
        .filter((r) => r.undoneAt === null)
        .map((r) => Object.fromEntries(Object.entries(r.payload as object).filter(([key]) => key !== 'setup')) as CombatEvent);
      return { status: encounter.status, combat: reduceCombat(active) };
    };

    const original = state(sourceId);
    const imported = state(result.id);
    const newElara = db.select().from(characters).where(eq(characters.campaignId, result.id)).all().find((c) => c.kind === 'pc')!;

    expect(imported.status).toBe('running');
    expect(imported.combat.round).toBe(original.combat.round);
    expect(imported.combat.turnIndex).toBe(original.combat.turnIndex);
    // Stessi combattenti, stessi PF; l'unica differenza è il personaggio a cui punta Elara.
    expect(imported.combat.combatants.map((c) => ({ ...c, characterId: undefined }))).toStrictEqual(
      original.combat.combatants.map((c) => ({ ...c, characterId: undefined })),
    );
    expect(imported.combat.combatants.find((c) => c.kind === 'pc')?.characterId).toBe(newElara.id);
    expect(newElara.id).not.toBe(original.combat.combatants.find((c) => c.kind === 'pc')?.characterId);

    // I segnalini puntano ancora a combattenti che esistono.
    const map = db.select().from(maps).where(eq(maps.campaignId, result.id)).all().find((m) => m.kind === 'battle')!;
    const ids = new Set(imported.combat.combatants.map((c) => c.id));
    for (const token of map.tokens as Array<{ combatantId: string | null }>) expect(ids.has(token.combatantId!)).toBe(true);

    // Ogni riga ha il suo file: eliminare una mappa non toglie l'immagine all'altra.
    const imported_ = db.select().from(maps).where(eq(maps.campaignId, result.id)).all();
    const handout = db.select().from(handouts).where(eq(handouts.campaignId, result.id)).all();
    const files = [...imported_, ...handout].map((row) => row.imageFile).filter((f) => f !== null);
    expect(new Set(files).size).toBe(files.length);

    // Le immagini sono file nuovi e leggibili, non i nomi dell'originale.
    const original_ = db.select().from(maps).where(eq(maps.campaignId, sourceId)).all()[0]!;
    expect(map.imageFile).not.toBe(original_.imageFile);
    expect(await images.read(map.imageFile!)).toStrictEqual(await images.read(original_.imageFile!));
  });
});

describe('archivio — tutto o niente (AC6, AC7)', () => {
  const count = () => ({
    campaigns: db.select().from(campaigns).all().length,
    characters: db.select().from(characters).all().length,
    uploads: readdirSync(uploads).length,
  });

  it('un’immagine che non è un’immagine: nulla viene importato', async () => {
    const archive = (await exportCampaign(db, sourceId, images))!;
    const [first] = Object.keys(archive.files);
    const tampered = { ...archive, files: { ...archive.files, [first!]: Buffer.from('<script>alert(1)</script>').toString('base64') } };

    const before = count();
    const result = await importCampaign(db, throughFile(tampered), images);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/immagine/);
    expect(count()).toStrictEqual(before);
  });

  it('un errore del database a metà: né righe né immagini restano indietro', async () => {
    const archive = throughFile((await exportCampaign(db, sourceId, images))!);
    // Le mappe si inseriscono per ultime: la campagna, i personaggi e gli scontri sono già scritti
    // quando questo fallisce.
    connection.exec(`CREATE TRIGGER fail_maps BEFORE INSERT ON maps BEGIN SELECT RAISE(ABORT, 'disco pieno'); END`);
    const before = count();
    try {
      const result = await importCampaign(db, archive, images);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error).toMatch(/disco pieno/);
    } finally {
      connection.exec('DROP TRIGGER fail_maps');
    }
    expect(count()).toStrictEqual(before);
  });

  it('rifiuta con un messaggio chiaro i file di altro tipo o di una versione futura', async () => {
    const archive = (await exportCampaign(db, sourceId, images))!;
    const check = (value: unknown) => {
      const parsed = archiveSchema.safeParse(value);
      return parsed.success ? 'ok' : describeArchiveError(parsed.error);
    };

    expect(check({ ...archive, format: 'altro' })).toBe('Non è un file di campagna di JumpMaster.');
    expect(check({ hello: 'world' })).toBe('Non è un file di campagna di JumpMaster.');
    expect(check({ ...archive, version: 99 })).toMatch(/versione più recente/);
    expect(check({ ...archive, characters: [{ ...archive.characters[0]!, str: 99 }] })).toBe(
      'Il file non è valido: characters › n. 1 › str — valore non valido.',
    );
  });

  it('un campo sconosciuto è un errore, non si scarta in silenzio', async () => {
    const archive = (await exportCampaign(db, sourceId, images))!;
    const parsed = archiveSchema.safeParse({ ...archive, notes: [{ ...archive.notes[0]!, colore: 'rosso' }] });
    expect(parsed.success).toBe(false);
  });

  it('rifiuta un registro di combattimento manomesso', async () => {
    const archive = (await exportCampaign(db, sourceId, images))!;
    const [encounter] = archive.encounters;
    const tampered = {
      ...archive,
      encounters: [{ ...encounter!, events: [{ ...encounter!.events[0]!, payload: { type: 'delete-everything' } }] }],
    };
    const parsed = archiveSchema.safeParse(tampered);
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(describeArchiveError(parsed.error)).toMatch(/evento del combattimento/);
  });
});

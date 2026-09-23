/**
 * Esportazione e importazione di una campagna (SPEC-0014).
 *
 * Database e file arrivano come parametri, senza `server-only`: così il test del giro completo
 * gira su un database SQLite vero, con le migrazioni reali, e su una cartella temporanea.
 * L'app li collega in `server.ts`.
 */
import { asc, eq, inArray } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import { ARCHIVE_FORMAT, ARCHIVE_VERSION, importedName, remapCharacterId, remapTrackLayers } from '@/core/archive';
import type { CampaignArchive, CampaignArchiveJson } from './schema';

const { campaigns, characters, notes, sessions, encounters, encounterMonsters, combatEvents, handouts, maps, ambienceTracks, ambienceScenes } = schema;

export type ArchiveDb = BetterSQLite3Database<typeof schema>;

/** Dove stanno i file caricati. In produzione è `data/uploads/`, nei test una cartella temporanea. */
export interface FileStore {
  read(name: string): Promise<Uint8Array | null>;
  /** Salva i byte con un nome nuovo; `null` se non sono un'immagine accettata. */
  saveImage(bytes: Uint8Array): Promise<string | null>;
  /** Come `saveImage`, per le tracce audio. */
  saveAudio(bytes: Uint8Array): Promise<string | null>;
  remove(name: string): Promise<void>;
}

/* ── Esportazione ─────────────────────────────────────────────────── */

type Plain<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };

/** Una riga come viaggia nel file: senza identificativi, con le date in testo ISO. */
function plain<T extends Record<string, unknown>, K extends keyof T>(row: T, drop: readonly K[]): Plain<Omit<T, K>> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if ((drop as readonly string[]).includes(key)) continue;
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out as Plain<Omit<T, K>>;
}

const ROW_IDS = ['id', 'campaignId'] as const;

export async function exportCampaign(db: ArchiveDb, campaignId: number, files: FileStore): Promise<CampaignArchiveJson | null> {
  const campaign = db.select().from(campaigns).where(eq(campaigns.id, campaignId)).get();
  if (!campaign) return null;

  const characterRows = db.select().from(characters).where(eq(characters.campaignId, campaignId)).orderBy(asc(characters.id)).all();
  const noteRows = db.select().from(notes).where(eq(notes.campaignId, campaignId)).orderBy(asc(notes.id)).all();
  const sessionRows = db.select().from(sessions).where(eq(sessions.campaignId, campaignId)).orderBy(asc(sessions.id)).all();
  const handoutRows = db.select().from(handouts).where(eq(handouts.campaignId, campaignId)).orderBy(asc(handouts.id)).all();
  const mapRows = db.select().from(maps).where(eq(maps.campaignId, campaignId)).orderBy(asc(maps.id)).all();
  const encounterRows = db.select().from(encounters).where(eq(encounters.campaignId, campaignId)).orderBy(asc(encounters.id)).all();

  const encounterIds = encounterRows.map((e) => e.id);
  const monsterRows = encounterIds.length
    ? db.select().from(encounterMonsters).where(inArray(encounterMonsters.encounterId, encounterIds)).orderBy(asc(encounterMonsters.id)).all()
    : [];
  const trackRows = db.select().from(ambienceTracks).where(eq(ambienceTracks.campaignId, campaignId)).orderBy(asc(ambienceTracks.id)).all();
  const sceneRows = db.select().from(ambienceScenes).where(eq(ambienceScenes.campaignId, campaignId)).orderBy(asc(ambienceScenes.id)).all();
  const eventRows = encounterIds.length
    ? db.select().from(combatEvents).where(inArray(combatEvents.encounterId, encounterIds)).orderBy(asc(combatEvents.seq)).all()
    : [];

  // Immagini e tracce viaggiano dentro il file. Se un file è sparito dal disco, la riga resta senza
  // immagine (o la traccia non viaggia): meglio un handout senza figura che nessun backup.
  const embedded: Record<string, string> = {};
  const embed = async (name: string): Promise<boolean> => {
    if (name in embedded) return true;
    const bytes = await files.read(name);
    if (!bytes) return false;
    embedded[name] = Buffer.from(bytes).toString('base64');
    return true;
  };
  const withImage = async <R extends { imageFile: string | null }>(row: R): Promise<R> =>
    !row.imageFile || (await embed(row.imageFile)) ? row : { ...row, imageFile: null };

  const tracks = [];
  for (const track of trackRows) if (await embed(track.file)) tracks.push(track);
  const exported = new Map(tracks.map((t) => [t.id, t.id]));

  return {
    format: ARCHIVE_FORMAT,
    version: ARCHIVE_VERSION,
    exportedAt: new Date().toISOString(),
    campaign: plain(campaign, ['id']),
    characters: characterRows.map(({ id, ...row }) => ({ ref: id, ...plain(row, ['campaignId']) })) as CampaignArchiveJson['characters'],
    notes: noteRows.map((row) => plain(row, ROW_IDS)),
    sessions: sessionRows.map((row) => plain(row, ROW_IDS)) as CampaignArchiveJson['sessions'],
    encounters: encounterRows.map((encounter) => ({
      ...plain(encounter, ROW_IDS),
      monsters: monsterRows.filter((m) => m.encounterId === encounter.id).map((m) => plain(m, ['id', 'encounterId'])),
      events: eventRows
        .filter((e) => e.encounterId === encounter.id)
        .map((e) => plain(e, ['id', 'encounterId'])) as CampaignArchiveJson['encounters'][number]['events'],
    })),
    handouts: await Promise.all(handoutRows.map(async (row) => plain(await withImage(row), ROW_IDS))),
    maps: (await Promise.all(mapRows.map(async (row) => plain(await withImage(row), ROW_IDS)))) as CampaignArchiveJson['maps'],
    ambienceTracks: tracks.map(({ id, ...row }) => ({ ref: id, ...plain(row, ['campaignId']) })),
    ambienceScenes: sceneRows.map((row) => ({
      ...plain(row, ROW_IDS),
      layers: remapTrackLayers(row.layers as Array<{ kind: string; trackId?: number }>, exported),
    })) as CampaignArchiveJson['ambienceScenes'],
    files: embedded,
  };
}

/* ── Importazione ─────────────────────────────────────────────────── */

export type ImportResult = { ok: true; id: number; name: string } | { ok: false; error: string };

/** SQLite limita le variabili per istruzione: le tabelle lunghe (il registro) si inseriscono a blocchi. */
const CHUNK = 200;

function chunks<T>(rows: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

/**
 * Crea una campagna **nuova** dal file (AC3). Tutto o niente (AC6): le immagini si scrivono per
 * prime, le righe in una sola transazione; se qualcosa va storto le immagini appena scritte si
 * cancellano e il database resta com'era.
 */
export async function importCampaign(db: ArchiveDb, archive: CampaignArchive, files: FileStore): Promise<ImportResult> {
  const written: string[] = [];

  try {
    // Ogni riga riceve la **sua** copia dell'immagine, anche se nel file due righe ne citano una
    // sola: nell'app un file appartiene a una riga, ed eliminare una mappa cancella il suo file.
    const copy = async (name: string | null, kind: 'image' | 'audio'): Promise<string | null> => {
      if (name === null) return null;
      const encoded = archive.files[name];
      const bytes = encoded === undefined ? null : new Uint8Array(Buffer.from(encoded, 'base64'));
      const saved = bytes === null ? null : kind === 'image' ? await files.saveImage(bytes) : await files.saveAudio(bytes);
      if (!saved) {
        throw new ArchiveError(`Il file non è valido: ${kind === 'image' ? 'l’immagine' : 'la traccia'} ${name} è danneggiata o non è del tipo giusto.`);
      }
      written.push(saved);
      return saved;
    };
    const handoutImages: Array<string | null> = [];
    for (const handout of archive.handouts) handoutImages.push(await copy(handout.imageFile, 'image'));
    const mapImages: Array<string | null> = [];
    for (const map of archive.maps) mapImages.push(await copy(map.imageFile, 'image'));
    const trackFiles: string[] = [];
    for (const track of archive.ambienceTracks) trackFiles.push((await copy(track.file, 'audio'))!);

    const result = db.transaction((tx) => {
      const existing = tx.select({ name: campaigns.name }).from(campaigns).all().map((c) => c.name);
      const name = importedName(archive.campaign.name, existing);
      const created = tx.insert(campaigns).values({ ...archive.campaign, name }).returning({ id: campaigns.id }).get();
      const campaignId = created.id;

      const characterIds = new Map<number, number>();
      for (const { ref, ...character } of archive.characters) {
        const row = tx.insert(characters).values({ ...character, campaignId }).returning({ id: characters.id }).get();
        characterIds.set(ref, row.id);
      }

      for (const part of chunks(archive.notes)) tx.insert(notes).values(part.map((n) => ({ ...n, campaignId }))).run();
      for (const part of chunks(archive.sessions)) tx.insert(sessions).values(part.map((s) => ({ ...s, campaignId }))).run();

      for (const { monsters, events, ...encounter } of archive.encounters) {
        const { id: encounterId } = tx.insert(encounters).values({ ...encounter, campaignId }).returning({ id: encounters.id }).get();
        for (const part of chunks(monsters)) tx.insert(encounterMonsters).values(part.map((m) => ({ ...m, encounterId }))).run();
        for (const part of chunks(events)) {
          tx.insert(combatEvents)
            .values(part.map((e) => ({ ...e, encounterId, payload: remapCharacterId(e.payload, characterIds) })))
            .run();
        }
      }

      const handoutRows = archive.handouts.map((h, i) => ({ ...h, campaignId, imageFile: handoutImages[i] ?? null }));
      for (const part of chunks(handoutRows)) tx.insert(handouts).values(part).run();
      const mapRows = archive.maps.map((m, i) => ({ ...m, campaignId, imageFile: mapImages[i] ?? null }));
      for (const part of chunks(mapRows)) tx.insert(maps).values(part).run();

      const trackIds = new Map<number, number>();
      archive.ambienceTracks.forEach(({ ref, ...track }, i) => {
        const row = tx.insert(ambienceTracks).values({ ...track, campaignId, file: trackFiles[i]! }).returning({ id: ambienceTracks.id }).get();
        trackIds.set(ref, row.id);
      });
      for (const part of chunks(archive.ambienceScenes)) {
        tx.insert(ambienceScenes).values(part.map((scene) => ({ ...scene, campaignId, layers: remapTrackLayers(scene.layers, trackIds) }))).run();
      }

      return { id: campaignId, name };
    });

    return { ok: true, ...result };
  } catch (error) {
    await Promise.all(written.map((name) => files.remove(name)));
    if (error instanceof ArchiveError) return { ok: false, error: error.message };
    return { ok: false, error: `Importazione non riuscita: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/** Un problema del file, già detto in italiano per il DM. */
class ArchiveError extends Error {}

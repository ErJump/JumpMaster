/**
 * Il file di una campagna esportata, validato al confine (AGENTS.md §8, SPEC-0014 AC7).
 *
 * Un file importato è input esterno come un form: può arrivare da un altro PC, da un'altra
 * versione dell'app, o essere stato ritoccato a mano. Qui si controlla tutto, campo per campo;
 * dopo questo punto i tipi sono garantiti.
 */
import { z } from 'zod';
import { ARCHIVE_FORMAT, ARCHIVE_VERSION } from '@/core/archive';
import type { CombatEvent } from '@/core/events';
import { fogSchema, pinsSchema, sessionPrepSchema, tokensSchema } from '@/db/schema/json';
import { UPLOAD_NAME } from '@/lib/image-type';

const SHORT = 200;
const LONG = 200_000;

const short = z.string().max(SHORT);
const long = z.string().max(LONG);
const date = z.iso.datetime().transform((value) => new Date(value));
const int = (min: number, max: number) => z.number().int().min(min).max(max);
const imageFile = z.string().regex(UPLOAD_NAME).nullable();
const abilityList = z.array(z.string().max(40)).max(40);

/* ── Combattimento ────────────────────────────────────────────────── */

const combatantId = z.string().min(1).max(80);
const hp = int(0, 100_000);

/**
 * Tutti gli eventi del registro. Il tipo dichiarato fa sì che, se `CombatEvent` cambia e questo
 * schema no, la compilazione si fermi: il file e il combat tracker non possono divergere.
 */
export const combatEventSchema: z.ZodType<CombatEvent> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('combat-start') }),
  z.object({
    type: z.literal('combatant-add'),
    id: combatantId,
    name: z.string().min(1).max(SHORT),
    kind: z.enum(['pc', 'npc', 'monster']),
    maxHp: hp,
    ac: int(0, 100),
    initiativeMod: int(-20, 40),
    initiative: int(-20, 200).optional(),
    srdMonsterSlug: short.optional(),
    characterId: z.number().int().positive().optional(),
  }),
  z.object({ type: z.literal('combatant-remove'), id: combatantId }),
  z.object({ type: z.literal('visibility-set'), id: combatantId, hidden: z.boolean() }),
  z.object({ type: z.literal('initiative-set'), id: combatantId, value: int(-20, 200) }),
  z.object({ type: z.literal('damage'), id: combatantId, amount: hp, critical: z.boolean().optional(), source: short.optional() }),
  z.object({ type: z.literal('heal'), id: combatantId, amount: hp }),
  z.object({ type: z.literal('temp-hp'), id: combatantId, amount: hp }),
  z.object({ type: z.literal('condition-add'), id: combatantId, condition: z.string().min(1).max(40) }),
  z.object({ type: z.literal('condition-remove'), id: combatantId, condition: z.string().min(1).max(40) }),
  z.object({ type: z.literal('concentration-set'), id: combatantId, spell: z.string().min(1).max(SHORT) }),
  z.object({ type: z.literal('concentration-break'), id: combatantId }),
  z.object({ type: z.literal('concentration-kept'), id: combatantId }),
  z.object({
    type: z.literal('death-save'),
    id: combatantId,
    result: z.enum(['success', 'failure', 'critical-success', 'critical-failure']),
  }),
  z.object({ type: z.literal('death-save-reset'), id: combatantId }),
  z.object({ type: z.literal('turn-next') }),
  z.object({ type: z.literal('turn-prev') }),
  z.object({ type: z.literal('note'), text: z.string().max(4000) }),
]);

/** Nel database l'evento porta anche `setup` (ADR-0005): gli eventi di preparazione non si annullano. */
export type StoredPayload = CombatEvent & { setup?: true };

const payloadSchema = z.looseObject({ setup: z.boolean().optional() }).transform((raw, ctx): StoredPayload => {
  const { setup, ...rest } = raw;
  const event = combatEventSchema.safeParse(rest);
  if (!event.success) {
    ctx.addIssue({ code: 'custom', message: 'evento del combattimento non riconosciuto' });
    return z.NEVER;
  }
  return setup ? { ...event.data, setup: true } : event.data;
});

/* ── Righe ────────────────────────────────────────────────────────── */

// Le righe sono `strictObject`: un campo che lo schema non conosce è un errore, non si scarta in
// silenzio. Se una migrazione aggiunge una colonna e l'archivio non la esporta, il test del giro
// completo fallisce invece di perdere dati senza dirlo.

const stamps = { createdAt: date, updatedAt: date };

const characterSchema = z.strictObject({
  /** Identificativo nel database d'origine: serve solo a ricollegare il registro del combattimento. */
  ref: z.number().int().positive(),
  kind: z.enum(['pc', 'npc']),
  name: z.string().trim().min(1).max(SHORT),
  playerName: short,
  className: short,
  subclass: short,
  race: short,
  level: int(1, 30),
  ac: int(0, 100),
  maxHp: int(1, 100_000),
  speed: int(0, 1000),
  str: int(1, 30),
  dex: int(1, 30),
  con: int(1, 30),
  int: int(1, 30),
  wis: int(1, 30),
  cha: int(1, 30),
  saveProficiencies: abilityList,
  skillProficiencies: abilityList,
  skillExpertise: abilityList,
  role: short,
  location: short,
  disposition: z.enum(['friendly', 'neutral', 'hostile', 'unknown']),
  appearance: long,
  voice: long,
  secret: long,
  srdMonsterSlug: short.nullable(),
  notes: long,
  archived: z.boolean(),
  ...stamps,
});

const noteSchema = z.strictObject({
  title: z.string().trim().min(1).max(SHORT),
  kind: z.enum(['place', 'faction', 'plot', 'lore', 'other']),
  body: long,
  ...stamps,
});

const sessionSchema = z.strictObject({
  number: int(0, 100_000),
  title: short,
  playedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  prep: sessionPrepSchema,
  journal: long,
  ...stamps,
});

const encounterSchema = z.strictObject({
  name: z.string().trim().min(1).max(SHORT),
  description: long,
  notes: long,
  status: z.enum(['planned', 'running', 'done']),
  ...stamps,
  monsters: z
    .array(
      z.strictObject({
        srdMonsterSlug: z.string().min(1).max(SHORT),
        count: int(1, 100),
        name: z.string().min(1).max(SHORT),
        cr: z.string().max(10),
        xp: int(0, 1_000_000),
        hp: int(0, 100_000),
        ac: int(0, 100),
        initiativeMod: int(-20, 40),
        hitDice: short.nullable(),
      }),
    )
    .max(200),
  events: z
    .array(
      z.strictObject({
        seq: int(1, 1_000_000),
        type: z.string().max(40),
        payload: payloadSchema,
        undoneAt: date.nullable(),
        createdAt: date,
      }),
    )
    .max(100_000),
});

const handoutSchema = z.strictObject({
  title: z.string().trim().min(1).max(SHORT),
  body: long,
  imageFile,
  ...stamps,
});

const mapSchema = z.strictObject({
  name: z.string().trim().min(1).max(SHORT),
  kind: z.enum(['battle', 'world']),
  imageFile,
  imageWidth: int(1, 50_000),
  imageHeight: int(1, 50_000),
  gridSize: int(10, 600),
  gridOffsetX: int(0, 600),
  gridOffsetY: int(0, 600),
  showGrid: z.boolean(),
  fog: fogSchema,
  tokens: tokensSchema,
  pins: pinsSchema,
  ...stamps,
});

/* ── Il file ──────────────────────────────────────────────────────── */

/** 10 MB di immagine diventano circa 13,4 MB in base64. */
const MAX_BASE64 = 14 * 1024 * 1024;

export const archiveSchema = z
  .object({
    format: z.literal(ARCHIVE_FORMAT, { error: 'Non è un file di campagna di JumpMaster.' }),
    version: z
      .number({ error: 'Il file non dichiara la versione del formato.' })
      .int()
      .min(1)
      .max(ARCHIVE_VERSION, { error: 'Il file viene da una versione più recente di JumpMaster: aggiorna l’app per importarlo.' }),
    exportedAt: date,
    campaign: z.strictObject({
      name: z.string().trim().min(1).max(SHORT),
      description: long,
      setting: short,
      dmNotes: long,
      partyLevel: int(1, 20),
      sessionCount: int(0, 100_000),
      status: z.enum(['active', 'paused', 'completed']),
      ...stamps,
    }),
    characters: z.array(characterSchema).max(10_000),
    notes: z.array(noteSchema).max(10_000),
    sessions: z.array(sessionSchema).max(10_000),
    encounters: z.array(encounterSchema).max(10_000),
    handouts: z.array(handoutSchema).max(1000),
    maps: z.array(mapSchema).max(1000),
    files: z.record(z.string().regex(UPLOAD_NAME), z.string().max(MAX_BASE64)),
  })
  .superRefine((archive, ctx) => {
    // Ogni immagine citata deve viaggiare nel file: meglio rifiutare subito che importare una
    // mappa senza sfondo.
    const referenced = [...archive.handouts, ...archive.maps].map((row) => row.imageFile).filter((f) => f !== null);
    for (const name of referenced) {
      if (!(name in archive.files)) ctx.addIssue({ code: 'custom', path: ['files', name], message: 'immagine mancante' });
    }
    const refs = new Set<number>();
    for (const character of archive.characters) {
      if (refs.has(character.ref)) ctx.addIssue({ code: 'custom', path: ['characters'], message: 'personaggi duplicati' });
      refs.add(character.ref);
    }
  });

export type CampaignArchive = z.output<typeof archiveSchema>;
/** Ciò che l'esportazione produce: date già in forma di testo, pronte per `JSON.stringify`. */
export type CampaignArchiveJson = z.input<typeof archiveSchema>;

/** Il primo problema del file, detto in italiano e con il punto esatto in cui si trova. */
export function describeArchiveError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Il file non è valido.';
  if (issue.path.length <= 1 && (issue.path[0] === 'format' || issue.path[0] === 'version')) return issue.message;
  const where = issue.path.map((part) => (typeof part === 'number' ? `n. ${part + 1}` : String(part))).join(' › ');
  const what = issue.code === 'custom' ? issue.message : 'valore non valido';
  return where ? `Il file non è valido: ${where} — ${what}.` : `Il file non è valido: ${what}.`;
}

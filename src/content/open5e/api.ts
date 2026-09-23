/**
 * L'API di Open5e (v2), vista dall'app: schemi Zod delle risposte e download (SPEC-0015).
 *
 * La risposta di un servizio esterno è input come un form: si valida, e solo i campi che usiamo.
 * I campi sconosciuti si ignorano (l'API cresce), quelli che usiamo devono avere la forma attesa.
 *
 * `fetch` arriva come parametro: nei test non si va in rete.
 */
import { z } from 'zod';

export const OPEN5E_API = 'https://api.open5e.com/v2';

/** Il regolamento dell'app (ADR-0013). */
export const GAME_SYSTEM = '5e-2014';

/**
 * Manuali esclusi anche se del regolamento giusto: l'SRD 5.1 c'è già, e il *Tome of Beasts* del
 * 2016 è sostituito dalla sua edizione 2023 (stessi mostri, con le correzioni).
 */
export const EXCLUDED_DOCUMENTS: ReadonlyMap<string, string> = new Map([
  ['srd-2014', 'già presente: è l’SRD 5.1'],
  ['tob', 'sostituito da Tome of Beasts 1 (2023 Edition)'],
]);

const ref = z.object({ key: z.string(), name: z.string() });
const nullableInt = z.number().int().nullable().optional();

/* ── Manuali e licenze ────────────────────────────────────────────── */

export const documentSchema = z.object({
  key: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  display_name: z.string().max(200).optional(),
  publisher: ref,
  gamesystem: ref,
  licenses: z.array(ref),
  permalink: z.string().max(500).nullable().optional(),
});
export type Open5eDocumentApi = z.infer<typeof documentSchema>;

export const licenseSchema = z.object({
  key: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  desc: z.string().max(200_000),
});
export type Open5eLicenseApi = z.infer<typeof licenseSchema>;

/* ── Creature ─────────────────────────────────────────────────────── */

const attackSchema = z.object({
  name: z.string(),
  to_hit_mod: z.number().int().nullable().optional(),
  damage_die_count: nullableInt,
  damage_die_type: z.string().nullable().optional(),
  damage_bonus: nullableInt,
  damage_type: ref.nullable().optional(),
  extra_damage_die_count: nullableInt,
  extra_damage_die_type: z.string().nullable().optional(),
  extra_damage_bonus: nullableInt,
  extra_damage_type: ref.nullable().optional(),
});

const actionSchema = z.object({
  name: z.string().min(1).max(200),
  desc: z.string().max(20_000),
  attacks: z.array(attackSchema).default([]),
  action_type: z.string(),
  order_in_statblock: z.number().int().nullable().optional(),
  legendary_action_cost: nullableInt,
  usage_limits: z.object({ type: z.string(), param: z.number().int().nullable().optional() }).nullable().optional(),
});
export type Open5eAction = z.infer<typeof actionSchema>;
export type Open5eAttack = z.infer<typeof attackSchema>;

const abilities = z.object({
  strength: z.number().int(),
  dexterity: z.number().int(),
  constitution: z.number().int(),
  intelligence: z.number().int(),
  wisdom: z.number().int(),
  charisma: z.number().int(),
});

export const creatureSchema = z.object({
  key: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  document: z.object({ key: z.string() }),
  size: ref,
  type: ref,
  subcategory: z.string().nullable().optional(),
  alignment: z.string().max(200).default(''),
  armor_class: z.number().int(),
  armor_detail: z.string().max(200).nullable().optional(),
  hit_points: z.number().int(),
  hit_dice: z.string().max(40).nullable().optional(),
  speed: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])),
  ability_scores: abilities,
  saving_throws: z.record(z.string(), z.number().int()).default({}),
  skill_bonuses: z.record(z.string(), z.number().int()).default({}),
  passive_perception: z.number().int().nullable().optional(),
  darkvision_range: nullableInt,
  blindsight_range: nullableInt,
  tremorsense_range: nullableInt,
  truesight_range: nullableInt,
  languages: z.object({ as_string: z.string().max(1000) }).nullable().optional(),
  challenge_rating: z.number().min(0).max(30),
  proficiency_bonus: nullableInt,
  experience_points: z.number().int().min(0),
  resistances_and_immunities: z
    .object({
      damage_immunities_display: z.string().max(1000).default(''),
      damage_resistances_display: z.string().max(1000).default(''),
      damage_vulnerabilities_display: z.string().max(1000).default(''),
      condition_immunities: z.array(ref).default([]),
    })
    .partial()
    .default({}),
  traits: z.array(z.object({ name: z.string().min(1).max(200), desc: z.string().max(20_000) })).default([]),
  actions: z.array(actionSchema).default([]),
});
export type Open5eCreature = z.infer<typeof creatureSchema>;

const page = <T extends z.ZodType>(item: T) =>
  z.object({ count: z.number().int(), next: z.string().nullable(), results: z.array(item) });

/* ── Download ─────────────────────────────────────────────────────── */

export type Fetch = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

/** Una pagina dell'API. Errori di rete e risposte malformate diventano un messaggio in italiano. */
async function getJson<T extends z.ZodType>(fetchImpl: Fetch, url: string, schema: T): Promise<z.infer<T>> {
  let response: Response;
  try {
    response = await fetchImpl(url, { signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new Open5eError('Open5e non risponde: controlla la connessione e riprova.');
  }
  if (!response.ok) throw new Open5eError(`Open5e ha risposto con un errore (${response.status}). Riprova più tardi.`);
  const parsed = schema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new Open5eError('Open5e ha risposto con dati che l’app non riconosce: forse la sua API è cambiata.');
  return parsed.data;
}

export class Open5eError extends Error {}

/** Tutte le pagine di un elenco, seguendo `next`. `onPage` riceve quante voci sono arrivate finora. */
async function getAll<T extends z.ZodType>(
  fetchImpl: Fetch,
  url: string,
  item: T,
  onPage?: (received: number, total: number) => void,
): Promise<Array<z.infer<T>>> {
  const out: Array<z.infer<T>> = [];
  let next: string | null = url;
  // Un'API che rimanda sempre alla stessa pagina non deve tenere l'app in un giro infinito.
  for (let guard = 0; next && guard < 200; guard++) {
    const data: { count: number; next: string | null; results: Array<z.infer<T>> } = await getJson(fetchImpl, next, page(item));
    out.push(...data.results);
    onPage?.(out.length, data.count);
    next = data.next;
  }
  return out;
}

export interface CatalogEntry {
  document: Open5eDocumentApi;
  monsterCount: number;
}

/** I manuali del regolamento 2014 che contengono mostri, esclusi quelli in `EXCLUDED_DOCUMENTS`. */
export async function fetchCatalog(fetchImpl: Fetch, api = OPEN5E_API): Promise<CatalogEntry[]> {
  const documents = await getAll(fetchImpl, `${api}/documents/?gamesystem__key=${GAME_SYSTEM}&limit=100`, documentSchema);
  const candidates = documents.filter((d) => d.gamesystem.key === GAME_SYSTEM && !EXCLUDED_DOCUMENTS.has(d.key));

  const counted = await Promise.all(
    candidates.map(async (document) => {
      const first = await getJson(
        fetchImpl,
        `${api}/creatures/?document__key=${encodeURIComponent(document.key)}&limit=1&fields=key`,
        page(z.unknown()),
      );
      return { document, monsterCount: first.count };
    }),
  );
  return counted.filter((entry) => entry.monsterCount > 0).sort((a, b) => a.document.name.localeCompare(b.document.name));
}

export interface DownloadedDocument {
  document: Open5eDocumentApi;
  licenses: Open5eLicenseApi[];
  creatures: Open5eCreature[];
}

/** Un manuale intero: metadati, licenze, creature. Nulla si scrive finché non è tutto arrivato. */
export async function fetchDocument(
  fetchImpl: Fetch,
  key: string,
  onProgress?: (received: number, total: number) => void,
  api = OPEN5E_API,
): Promise<DownloadedDocument> {
  const document = await getJson(fetchImpl, `${api}/documents/${encodeURIComponent(key)}/`, documentSchema);
  if (document.gamesystem.key !== GAME_SYSTEM || EXCLUDED_DOCUMENTS.has(document.key)) {
    throw new Open5eError(`«${document.name}» non è fra i manuali che l’app può usare.`);
  }
  const licenses = await Promise.all(
    document.licenses.map((license) => getJson(fetchImpl, `${api}/licenses/${encodeURIComponent(license.key)}/`, licenseSchema)),
  );
  const creatures = await getAll(
    fetchImpl,
    `${api}/creatures/?document__key=${encodeURIComponent(key)}&limit=100`,
    creatureSchema,
    onProgress,
  );
  return { document, licenses, creatures };
}

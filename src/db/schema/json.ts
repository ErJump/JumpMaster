/**
 * Forma delle colonne JSON: segnalini, segnaposto e nebbia delle mappe, preparazione delle
 * sessioni.
 *
 * Stanno accanto alle tabelle perché la forma di una colonna è parte dello schema, e perché le
 * usano più moduli: la slice che le scrive, le letture condivise e l'archivio che le importa
 * (SPEC-0014). Nessun `server-only` qui: sono solo schemi Zod, validi ovunque.
 *
 * Non è riesportato da `./index`: quello è l'insieme delle tabelle che Drizzle riceve.
 */
import { z } from 'zod';

/* ── Mappe (SPEC-0012, SPEC-0013) ─────────────────────────────────── */

export const tokenSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  col: z.number().int().min(-1000).max(1000),
  row: z.number().int().min(-1000).max(1000),
  size: z.number().int().min(1).max(4),
  combatantId: z.string().max(80).nullable(),
  hidden: z.boolean(),
});

export const pinSchema = z.object({
  id: z.string().min(1).max(64),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  label: z.string().trim().min(1).max(120),
  known: z.boolean(),
});

export const tokensSchema = z.array(tokenSchema).max(200);
export const pinsSchema = z.array(pinSchema).max(300);
/** Caselle rivelate, `"col,row"`. */
export const fogSchema = z.array(z.string().regex(/^-?\d+,-?\d+$/)).max(40_000);

/* ── Sessioni (SPEC-0010) ─────────────────────────────────────────── */

const item = z.object({ id: z.string().min(1).max(64), text: z.string().max(4000) });
const secret = item.extend({ revealed: z.boolean() });
const list = z.array(item).max(60, 'Troppe voci in un solo passo.');

export const sessionPrepSchema = z.object({
  characters: z.string().max(20000),
  strongStart: z.string().max(20000),
  scenes: list,
  secrets: z.array(secret).max(100, 'Troppi segreti in una sola sessione.'),
  locations: list,
  npcs: list,
  monsters: list,
  rewards: list,
});

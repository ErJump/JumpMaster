/**
 * Lettura di una mappa come `MapSpec` (invariante I7): la usano la slice `maps` e la Vista
 * Giocatori. I campi JSON si validano qui, così a valle arrivano sempre dati ben formati.
 */
import 'server-only';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../client';
import { maps, type MapRow } from '../schema';
import { imageUrl } from '../files';
import type { MapSpec } from '@/core/maps';

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

const fogSchema = z.array(z.string().regex(/^-?\d+,-?\d+$/)).max(40_000);

export function mapSpecFromRow(row: MapRow): MapSpec {
  const tokens = z.array(tokenSchema).safeParse(row.tokens);
  const pins = z.array(pinSchema).safeParse(row.pins);
  const fog = fogSchema.safeParse(row.fog);
  return {
    kind: row.kind,
    imageUrl: imageUrl(row.imageFile),
    imageWidth: row.imageWidth,
    imageHeight: row.imageHeight,
    grid: { size: row.gridSize, offsetX: row.gridOffsetX, offsetY: row.gridOffsetY },
    showGrid: row.showGrid,
    fog: fog.success ? fog.data : [],
    tokens: tokens.success ? tokens.data : [],
    pins: pins.success ? pins.data : [],
  };
}

export function loadMap(id: number): { row: MapRow; spec: MapSpec } | null {
  const row = db.select().from(maps).where(eq(maps.id, id)).get();
  return row ? { row, spec: mapSpecFromRow(row) } : null;
}

/**
 * Lettura di una mappa come `MapSpec` (invariante I7): la usano la slice `maps` e la Vista
 * Giocatori. I campi JSON si validano qui, così a valle arrivano sempre dati ben formati.
 */
import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '../client';
import { maps, type MapRow } from '../schema';
import { imageUrl } from '../files';
import { fogSchema, pinsSchema, tokensSchema } from '../schema/json';
import type { MapSpec } from '@/core/maps';

export function mapSpecFromRow(row: MapRow): MapSpec {
  const tokens = tokensSchema.safeParse(row.tokens);
  const pins = pinsSchema.safeParse(row.pins);
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

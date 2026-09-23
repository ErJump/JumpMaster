import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { maps, type MapRow } from '@/db/schema';

export function listMaps(campaignId: number): MapRow[] {
  return db.select().from(maps).where(eq(maps.campaignId, campaignId)).orderBy(desc(maps.updatedAt)).all();
}

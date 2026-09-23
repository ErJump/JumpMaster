import 'server-only';
import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { campaigns, characters, maps, notes, sessions } from '@/db/schema';

export interface ArchiveEntry {
  id: number;
  name: string;
  characters: number;
  notes: number;
  sessions: number;
  maps: number;
}

/** Le campagne con un colpo d'occhio su quanto contengono: si capisce cosa si sta per salvare. */
export function listArchiveEntries(): ArchiveEntry[] {
  const counted = <T extends typeof characters | typeof notes | typeof sessions | typeof maps>(table: T, campaignId: number) =>
    db.select({ n: count() }).from(table).where(eq(table.campaignId, campaignId)).get()?.n ?? 0;

  return db
    .select({ id: campaigns.id, name: campaigns.name })
    .from(campaigns)
    .orderBy(asc(campaigns.name))
    .all()
    .map((c) => ({
      ...c,
      characters: counted(characters, c.id),
      notes: counted(notes, c.id),
      sessions: counted(sessions, c.id),
      maps: counted(maps, c.id),
    }));
}

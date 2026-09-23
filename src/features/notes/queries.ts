import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { notes, type Note } from '@/db/schema';

export function listNotes(campaignId: number): Note[] {
  return db.select().from(notes).where(eq(notes.campaignId, campaignId)).orderBy(desc(notes.updatedAt)).all();
}

export function getNote(id: number): Note | undefined {
  return db.select().from(notes).where(eq(notes.id, id)).get();
}

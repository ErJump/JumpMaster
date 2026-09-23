import 'server-only';
import { and, asc, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { sessions, type Session } from '@/db/schema';

export function listSessions(campaignId: number): Session[] {
  return db.select().from(sessions).where(eq(sessions.campaignId, campaignId)).orderBy(asc(sessions.number)).all();
}

export function getSession(id: number): Session | undefined {
  return db.select().from(sessions).where(eq(sessions.id, id)).get();
}

/** La sessione successiva, se esiste: segna la fine della finestra per la bozza dal registro. */
export function nextSession(session: Session): Session | undefined {
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.campaignId, session.campaignId), gt(sessions.number, session.number)))
    .orderBy(asc(sessions.number))
    .get();
}

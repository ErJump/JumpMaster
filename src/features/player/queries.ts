import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { encounters, handouts, liveState, type Handout, type LiveState } from '@/db/schema';
import { loadCombatEvents } from '@/db/queries/combat-log';
import { reduceCombat, toPublicCombat } from '@/core/events';
import { imageUrl } from './uploads';
import type { PlayerView, PublicRoll } from './types';

export function liveStateFor(campaignId: number): LiveState {
  return (
    db.select().from(liveState).where(eq(liveState.campaignId, campaignId)).get() ?? {
      campaignId,
      mode: 'auto',
      handoutId: null,
      lastRoll: null,
      updatedAt: new Date(0),
    }
  );
}

export function listHandouts(campaignId: number): Handout[] {
  return db.select().from(handouts).where(eq(handouts.campaignId, campaignId)).orderBy(desc(handouts.updatedAt)).all();
}

function runningEncounterId(campaignId: number): number | null {
  return (
    db
      .select({ id: encounters.id })
      .from(encounters)
      .where(and(eq(encounters.campaignId, campaignId), eq(encounters.status, 'running')))
      .get()?.id ?? null
  );
}

/**
 * La vista dei giocatori, calcolata sul server. È l'**unico** punto che decide cosa è pubblico:
 * `/player` e `/api/live` usano solo questa funzione (ADR-0009).
 */
export function buildPlayerView(campaign: { id: number; name: string } | undefined): PlayerView {
  if (!campaign) return { kind: 'idle', campaign: null, roll: null };

  const live = liveStateFor(campaign.id);
  const roll = (live.lastRoll as PublicRoll | null) ?? null;

  if (live.mode === 'blackout') return { kind: 'idle', campaign: campaign.name, roll: null };

  if (live.mode === 'handout' && live.handoutId !== null) {
    const handout = db.select().from(handouts).where(eq(handouts.id, live.handoutId)).get();
    if (handout) {
      return {
        kind: 'handout',
        campaign: campaign.name,
        roll,
        handout: { title: handout.title, body: handout.body, imageUrl: imageUrl(handout.imageFile) },
      };
    }
  }

  // Automatico: se c'è un combattimento in corso, i giocatori vedono quello.
  const encounterId = runningEncounterId(campaign.id);
  if (encounterId !== null) {
    const state = reduceCombat(loadCombatEvents(encounterId).map(({ event }) => event));
    return { kind: 'combat', campaign: campaign.name, roll, combat: toPublicCombat(state) };
  }

  return { kind: 'idle', campaign: campaign.name, roll };
}

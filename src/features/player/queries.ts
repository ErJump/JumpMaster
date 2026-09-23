import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { handouts, liveState, type Handout, type LiveState } from '@/db/schema';
import { runningCombat } from '@/db/queries/combat-log';
import { loadMap } from '@/db/queries/maps';
import { toPublicCombat } from '@/core/events';
import { toPublicMap } from '@/core/maps';
import { imageUrl } from '@/db/files';
import type { PlayerView, PublicRoll } from './types';

export function liveStateFor(campaignId: number): LiveState {
  return (
    db.select().from(liveState).where(eq(liveState.campaignId, campaignId)).get() ?? {
      campaignId,
      mode: 'auto',
      handoutId: null,
      mapId: null,
      lastRoll: null,
      updatedAt: new Date(0),
    }
  );
}

export function listHandouts(campaignId: number): Handout[] {
  return db.select().from(handouts).where(eq(handouts.campaignId, campaignId)).orderBy(desc(handouts.updatedAt)).all();
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

  const combat = runningCombat(campaign.id);

  // Una mappa mostrata esplicitamente vince sull'automatico (SPEC-0012 AC12).
  if (live.mode === 'map' && live.mapId !== null) {
    const map = loadMap(live.mapId);
    if (map && map.row.campaignId === campaign.id) {
      return { kind: 'map', campaign: campaign.name, roll, map: toPublicMap(map.spec, combat?.state ?? null) };
    }
  }

  // Automatico: se c'è un combattimento in corso, i giocatori vedono quello.
  if (combat) return { kind: 'combat', campaign: campaign.name, roll, combat: toPublicCombat(combat.state) };

  return { kind: 'idle', campaign: campaign.name, roll };
}

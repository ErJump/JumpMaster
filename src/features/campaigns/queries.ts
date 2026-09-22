import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { campaigns, appSettings, type Campaign } from '@/db/schema';

const ACTIVE_CAMPAIGN_KEY = 'activeCampaignId';

export function listCampaigns(): Campaign[] {
  return db.select().from(campaigns).orderBy(desc(campaigns.updatedAt)).all();
}

export function getCampaign(id: number): Campaign | undefined {
  return db.select().from(campaigns).where(eq(campaigns.id, id)).get();
}

/**
 * La campagna attiva sta nel **database**, non in localStorage.
 *
 * La Vista Giocatori (M3) sarà una seconda finestra: se questa informazione vivesse nel
 * browser, le due finestre potrebbero divergere e il DM si ritroverebbe a condividere
 * la campagna sbagliata. Vedi SPEC-0002 design.
 */
export function getActiveCampaign(): Campaign | undefined {
  const setting = db.select().from(appSettings).where(eq(appSettings.key, ACTIVE_CAMPAIGN_KEY)).get();
  if (!setting) return undefined;

  const id = Number(setting.value);
  if (!Number.isInteger(id)) return undefined;

  return getCampaign(id);
}

export { ACTIVE_CAMPAIGN_KEY };

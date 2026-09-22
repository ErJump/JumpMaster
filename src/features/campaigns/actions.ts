'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { campaigns, appSettings } from '@/db/schema';
import { parseCampaignForm } from './schema';
import { ACTIVE_CAMPAIGN_KEY } from './queries';

export interface FormState {
  /** Messaggio di errore per campo, così il form può mostrarlo accanto all'input giusto. */
  errors?: Record<string, string>;
  message?: string;
}

function collectErrors(issues: Array<{ path: PropertyKey[]; message: string }>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'form');
    errors[field] ??= issue.message;
  }
  return errors;
}

export async function createCampaign(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseCampaignForm(formData);
  if (!parsed.success) {
    return { errors: collectErrors(parsed.error.issues) };
  }

  const now = new Date();
  const created = db
    .insert(campaigns)
    .values({ ...parsed.data, createdAt: now, updatedAt: now })
    .returning({ id: campaigns.id })
    .get();

  // Se non c'è una campagna attiva, questa lo diventa: il DM non deve fare un passo
  // in più per cominciare. Vale alla prima campagna e anche dopo aver eliminato quella attiva.
  const active = db.select().from(appSettings).where(eq(appSettings.key, ACTIVE_CAMPAIGN_KEY)).get();
  if (!active && created) {
    setActiveCampaignId(created.id);
  }

  revalidatePath('/campagne');
  revalidatePath('/');
  redirect(`/campagne/${created?.id}`);
}

export async function updateCampaign(id: number, _previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseCampaignForm(formData);
  if (!parsed.success) {
    return { errors: collectErrors(parsed.error.issues) };
  }

  db.update(campaigns)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .run();

  revalidatePath('/campagne');
  revalidatePath(`/campagne/${id}`);
  revalidatePath('/');
  return { message: 'Salvato.' };
}

export async function deleteCampaign(id: number): Promise<void> {
  db.delete(campaigns).where(eq(campaigns.id, id)).run();

  // Se era la campagna attiva, il puntatore resterebbe appeso nel vuoto.
  const active = db.select().from(appSettings).where(eq(appSettings.key, ACTIVE_CAMPAIGN_KEY)).get();
  if (active && Number(active.value) === id) {
    db.delete(appSettings).where(eq(appSettings.key, ACTIVE_CAMPAIGN_KEY)).run();
  }

  revalidatePath('/campagne');
  revalidatePath('/');
  redirect('/campagne');
}

export async function setActiveCampaign(id: number): Promise<void> {
  setActiveCampaignId(id);
  revalidatePath('/', 'layout');
}

function setActiveCampaignId(id: number): void {
  db.insert(appSettings)
    .values({ key: ACTIVE_CAMPAIGN_KEY, value: String(id) })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: String(id) } })
    .run();
}

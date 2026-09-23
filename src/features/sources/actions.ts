'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db/client';
import { removeDocument } from './install';

/** Toglie un manuale. Gli scontri che ne usavano i mostri restano giocabili (SPEC-0015 AC6). */
export async function removeSource(key: string): Promise<void> {
  removeDocument(db, key);
  revalidatePath('/fonti');
  revalidatePath('/bestiario', 'layout');
  revalidatePath('/scontri', 'layout');
}

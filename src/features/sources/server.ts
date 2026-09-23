/**
 * «Fonti aperte» collegate all'app: la rete vera e il database vero (SPEC-0015).
 * La logica sta in `install.ts` e in `content/open5e`, provate senza rete né Next.
 */
import 'server-only';
import { revalidatePath } from 'next/cache';
import { db } from '@/db/client';
import { fetchCatalog, fetchDocument, OPEN5E_API, Open5eError, type CatalogEntry } from '@/content/open5e/api';
import { installDocument } from './install';

/**
 * Il catalogo cambia di rado: dieci minuti di memoria evitano venti richieste a ogni apertura
 * della pagina. Un errore non si ricorda: al prossimo tentativo si riprova.
 */
/** Si può puntare a un altro indirizzo (un mirror, o una porta chiusa per provare l'app senza rete). */
const API = process.env.JUMPMASTER_OPEN5E_API ?? OPEN5E_API;

const CATALOG_TTL_MS = 10 * 60 * 1000;
let cached: { at: number; entries: CatalogEntry[] } | null = null;

export type CatalogResult = { ok: true; entries: CatalogEntry[] } | { ok: false; error: string };

export async function availableSources(): Promise<CatalogResult> {
  if (cached && Date.now() - cached.at < CATALOG_TTL_MS) return { ok: true, entries: cached.entries };
  try {
    const entries = await fetchCatalog(fetch, API);
    cached = { at: Date.now(), entries };
    return { ok: true, entries };
  } catch (error) {
    return { ok: false, error: error instanceof Open5eError ? error.message : 'Open5e non risponde: controlla la connessione e riprova.' };
  }
}

export type InstallEvent = { type: 'progress'; received: number; total: number } | { type: 'done'; count: number } | { type: 'error'; message: string };

/** Scarica e installa un manuale, raccontando l'avanzamento. Il database si tocca solo alla fine. */
export async function downloadSource(key: string, emit: (event: InstallEvent) => void): Promise<void> {
  try {
    const downloaded = await fetchDocument(fetch, key, (received, total) => emit({ type: 'progress', received, total }), API);
    const count = installDocument(db, downloaded);
    revalidatePath('/fonti');
    revalidatePath('/bestiario', 'layout');
    revalidatePath('/scontri', 'layout');
    emit({ type: 'done', count });
  } catch (error) {
    emit({ type: 'error', message: error instanceof Open5eError ? error.message : `Download non riuscito: ${error instanceof Error ? error.message : String(error)}` });
  }
}

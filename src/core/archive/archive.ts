/**
 * Archivio di una campagna (SPEC-0014): le regole pure del formato.
 *
 * ⚠ Modulo puro (invariante I1): niente database, niente file system. Chi legge e scrive le righe
 * sta in `features/archive`.
 */

export const ARCHIVE_FORMAT = 'jumpmaster.campaign';

/**
 * Versione del formato. Si alza solo quando un file vecchio non si potrebbe più leggere così com'è;
 * un'app più vecchia rifiuta i file più nuovi invece di importarli a metà.
 */
export const ARCHIVE_VERSION = 1;

/** `jumpmaster-la-maledizione-di-strahd-2026-09-23.json`: si capisce cos'è anche fra i download. */
export function archiveFileName(campaignName: string, date: Date): string {
  const slug =
    campaignName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/, '') || 'campagna';
  const day = date.toISOString().slice(0, 10);
  return `jumpmaster-${slug}-${day}.json`;
}

/**
 * Nome della campagna importata. Mai un doppione: il DM deve poter distinguere a colpo d'occhio
 * l'originale dalla copia appena rientrata.
 */
export function importedName(name: string, existing: readonly string[]): string {
  const taken = new Set(existing.map((n) => n.trim().toLocaleLowerCase('it')));
  const free = (candidate: string) => !taken.has(candidate.toLocaleLowerCase('it'));

  const base = name.trim();
  if (free(base)) return base;
  if (free(`${base} (importata)`)) return `${base} (importata)`;
  for (let n = 2; ; n++) {
    const candidate = `${base} (importata ${n})`;
    if (free(candidate)) return candidate;
  }
}

/**
 * Riscrive il `characterId` di un evento del combattimento con l'identificativo che il personaggio
 * ha ricevuto nel nuovo database. Se il personaggio non è nel file, il collegamento si toglie:
 * il combattente resta, semplicemente non punta più a una scheda.
 */
export function remapCharacterId<T extends object>(event: T, ids: ReadonlyMap<number, number>): T {
  if (!('characterId' in event) || typeof event.characterId !== 'number') return event;
  const { characterId, ...rest } = event;
  const mapped = ids.get(characterId);
  return (mapped === undefined ? rest : { ...rest, characterId: mapped }) as T;
}

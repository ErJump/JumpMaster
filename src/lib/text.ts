/** Utility di testo condivise. */

/**
 * Normalizza una stringa per la ricerca: minuscole e accenti rimossi.
 *
 * Serve perché il glossario cerca in due lingue (SPEC-0003 AC16): chi digita "prono"
 * deve trovare *Prone*, e chi digita "perche" deve trovare "perché".
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Vero se `haystack` contiene `needle`, ignorando accenti e maiuscole. */
export function matchesSearch(haystack: string, needle: string): boolean {
  return normalizeForSearch(haystack).includes(normalizeForSearch(needle));
}

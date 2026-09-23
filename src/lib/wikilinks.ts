/**
 * Collegamenti fra note: `[[Titolo]]` e `[[Titolo|testo mostrato]]`. SPEC-0009.
 *
 * I collegamenti **non si salvano**: si ricavano dal testo ogni volta. Così non esiste una
 * seconda fonte di verità da tenere allineata, e un testo modificato è sempre coerente con i
 * suoi collegamenti.
 */
import { normalizeForSearch } from './text';

/** Riconosce `[[destinazione]]` e `[[destinazione|etichetta]]`. */
export const WIKILINK_PATTERN = /\[\[([^\[\]|]+?)(?:\|([^\[\]]+?))?\]\]/g;

/**
 * Chiave di confronto: minuscole, senza accenti, spazi compressi. «Città di Vallaki» e
 * «citta  di vallaki» sono lo stesso posto.
 */
export function linkKey(title: string): string {
  return normalizeForSearch(title).trim().replace(/\s+/g, ' ');
}

/** I titoli citati in un testo, senza doppioni (a parità di chiave vince la prima grafia). */
export function extractLinks(body: string): string[] {
  const seen = new Map<string, string>();
  for (const match of body.matchAll(WIKILINK_PATTERN)) {
    const title = match[1]!.trim();
    const key = linkKey(title);
    if (key && !seen.has(key)) seen.set(key, title);
  }
  return [...seen.values()];
}

/** Vero se il testo cita il titolo dato. */
export function linksTo(body: string, title: string): boolean {
  const key = linkKey(title);
  return extractLinks(body).some((linked) => linkKey(linked) === key);
}

/**
 * Riscrive i collegamenti dopo una rinomina (SPEC-0009 AC6). L'etichetta scelta dall'autore,
 * se c'è, resta com'era: `[[Vecchio|la rocca]]` → `[[Nuovo|la rocca]]`.
 */
export function renameLinks(body: string, from: string, to: string): string {
  const fromKey = linkKey(from);
  return body.replace(WIKILINK_PATTERN, (whole, target: string, label?: string) => {
    if (linkKey(target) !== fromKey) return whole;
    return label ? `[[${to}|${label}]]` : `[[${to}]]`;
  });
}

export interface LinkTargets {
  notes: Array<{ id: number; title: string }>;
  characters: Array<{ id: number; name: string }>;
}

/**
 * Dove porta `[[target]]`: a una nota, altrimenti a un personaggio con quel nome, altrimenti a
 * «crea questa nota» (SPEC-0009 AC2–AC4).
 */
export function resolveLinkIn(targets: LinkTargets, target: string): { href: string; missing: boolean } {
  const key = linkKey(target);
  const note = targets.notes.find((n) => linkKey(n.title) === key);
  if (note) return { href: `/note/${note.id}`, missing: false };
  const character = targets.characters.find((c) => linkKey(c.name) === key);
  if (character) return { href: `/personaggi/${character.id}`, missing: false };
  return { href: `/note/nuova?titolo=${encodeURIComponent(target.trim())}`, missing: true };
}

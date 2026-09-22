/**
 * Grado di sfida (GS) e punti esperienza.
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * I GS frazionari sono la trappola classica: nei dati SRD valgono 0.125, 0.25 e 0.5, ma sulle
 * schede si scrivono ⅛, ¼ e ½. Mostrare "GS 0.125" a un DM è esattamente il tipo di attrito
 * che questa app esiste per evitare.
 *
 * Riferimento: SRD 5.1, "Monsters" / tabella dei PE per grado di sfida.
 */

/** Frazioni con la loro resa tipografica. */
const FRACTIONAL_LABELS: ReadonlyArray<readonly [number, string]> = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [0.5, '½'],
];

/** PE per grado di sfida. SRD 5.1. */
const XP_BY_CR: ReadonlyMap<number, number> = new Map([
  [0, 10],
  [0.125, 25],
  [0.25, 50],
  [0.5, 100],
  [1, 200],
  [2, 450],
  [3, 700],
  [4, 1100],
  [5, 1800],
  [6, 2300],
  [7, 2900],
  [8, 3900],
  [9, 5000],
  [10, 5900],
  [11, 7200],
  [12, 8400],
  [13, 10000],
  [14, 11500],
  [15, 13000],
  [16, 15000],
  [17, 18000],
  [18, 20000],
  [19, 22000],
  [20, 25000],
  [21, 33000],
  [22, 41000],
  [23, 50000],
  [24, 62000],
  [25, 75000],
  [26, 90000],
  [27, 105000],
  [28, 120000],
  [29, 135000],
  [30, 155000],
]);

/** Etichetta leggibile di un GS: `0.25` → `"¼"`, `10` → `"10"`. */
export function crLabel(cr: number): string {
  const fraction = FRACTIONAL_LABELS.find(([value]) => value === cr);
  return fraction ? fraction[1] : String(cr);
}

/** Inverso di `crLabel`: `"¼"` → `0.25`. Restituisce `null` se l'etichetta non è valida. */
export function crFromLabel(label: string): number | null {
  const trimmed = label.trim();

  const fraction = FRACTIONAL_LABELS.find(([, text]) => text === trimmed);
  if (fraction) return fraction[0];

  // Accetta anche la forma scritta "1/4", che è come la si digita.
  const slash = /^(\d+)\s*\/\s*(\d+)$/.exec(trimmed);
  if (slash) {
    const denominator = Number(slash[2]);
    if (denominator === 0) return null;
    return Number(slash[1]) / denominator;
  }

  // Attenzione: `Number('')` vale 0, non NaN. Senza questo controllo una stringa
  // vuota verrebbe letta come "grado di sfida 0".
  if (trimmed === '') return null;

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

/** PE assegnati per un mostro del GS dato. `null` se il GS non è in tabella. */
export function crToXp(cr: number): number | null {
  return XP_BY_CR.get(cr) ?? null;
}

/** Tutti i GS esistenti, in ordine: utile per popolare i filtri del bestiario. */
export function allChallengeRatings(): ReadonlyArray<{ cr: number; label: string; xp: number }> {
  return [...XP_BY_CR.entries()].map(([cr, xp]) => ({ cr, label: crLabel(cr), xp }));
}

/**
 * Tesori — SPEC-0011 AC6.
 *
 * ⚠️ **Formula dell'app, non una tabella ufficiale**: le tabelle dei tesori della Guida del DM
 * non sono nell'SRD (ADR-0011). Monete che crescono col livello, oggetti magici SRD di rarità
 * coerente. ⚠ Modulo puro (invariante I1).
 */
import { between, chance, pick, type Rng } from './random';

export interface TreasureItem {
  slug: string;
  name: string;
  rarity: string;
}

export interface GeneratedTreasure {
  coins: { oro: number; argento: number; rame: number };
  items: TreasureItem[];
}

/** Rarità ammesse, probabilità del primo e del secondo oggetto, per fascia di livello. */
const TIERS = [
  { maxLevel: 4, rarities: ['Common', 'Uncommon'], first: 0.3, second: 0 },
  { maxLevel: 10, rarities: ['Uncommon', 'Rare'], first: 0.5, second: 0.1 },
  { maxLevel: 16, rarities: ['Rare', 'Very Rare'], first: 0.7, second: 0.25 },
  { maxLevel: 20, rarities: ['Very Rare', 'Legendary'], first: 0.9, second: 0.4 },
] as const;

export function treasureTier(level: number) {
  const clamped = Math.min(20, Math.max(1, Math.round(level)));
  return TIERS.find((tier) => clamped <= tier.maxLevel) ?? TIERS[TIERS.length - 1]!;
}

export function generateTreasure(rng: Rng, level: number, magicItems: readonly TreasureItem[]): GeneratedTreasure {
  const clamped = Math.min(20, Math.max(1, Math.round(level)));
  const tier = treasureTier(clamped);

  const coins = {
    oro: clamped * 10 * between(rng, 1, 6),
    argento: between(rng, 1, 6) * 10,
    rame: between(rng, 1, 6) * 20,
  };

  const allowed = magicItems.filter((item) => (tier.rarities as readonly string[]).includes(item.rarity));
  const items: TreasureItem[] = [];
  if (allowed.length > 0 && chance(rng, tier.first)) {
    items.push(pick(rng, allowed));
    if (chance(rng, tier.second)) {
      const other = allowed.filter((item) => item.slug !== items[0]!.slug);
      if (other.length > 0) items.push(pick(rng, other));
    }
  }

  return { coins, items };
}

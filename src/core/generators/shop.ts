/**
 * Botteghe — SPEC-0011. La merce è equipaggiamento SRD **coi prezzi del manuale** (AC7):
 * arriva come argomento, il generatore non conosce il database. ⚠ Modulo puro (invariante I1).
 */
import { generateNpc, type GeneratedNpc } from './npc';
import { between, pick, pickMany, type Rng } from './random';
import { SHOP_KINDS, SHOP_QUIRKS } from './tables';

export interface ShopStock {
  slug: string;
  name: string;
  category: string;
  costValue: number | null;
  costUnit: string | null;
}

export interface GeneratedShop {
  name: string;
  kind: string;
  keeper: GeneratedNpc;
  quirk: string;
  items: ShopStock[];
}

export function generateShop(rng: Rng, equipment: readonly ShopStock[]): GeneratedShop {
  // Solo i tipi di bottega per cui c'è davvero merce: un emporio vuoto non serve a nessuno.
  const available = SHOP_KINDS.filter((shop) =>
    equipment.some((item) => (shop.categories as readonly string[]).includes(item.category) && item.costValue !== null),
  );
  const shop = pick(rng, available.length > 0 ? available : SHOP_KINDS);
  const keeper = generateNpc(rng, { occupation: shop.keeper });

  const stock = equipment.filter(
    (item) => (shop.categories as readonly string[]).includes(item.category) && item.costValue !== null,
  );
  const items = pickMany(rng, stock, between(rng, 5, 8)).sort((a, b) => a.name.localeCompare(b.name, 'it'));

  return {
    name: `${shop.kind} di ${keeper.name.split(' ')[0]}`,
    kind: shop.kind,
    keeper,
    quirk: pick(rng, SHOP_QUIRKS),
    items,
  };
}

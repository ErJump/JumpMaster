/**
 * Letture dell'SRD per i generatori (invariante I7): la merce delle botteghe e gli oggetti dei
 * tesori. Solo i campi che servono, non i payload completi.
 */
import 'server-only';
import { asc } from 'drizzle-orm';
import { db } from '../client';
import { srdEquipment, srdMagicItems } from '../schema';

export function equipmentForShops() {
  return db
    .select({
      slug: srdEquipment.slug,
      name: srdEquipment.name,
      category: srdEquipment.category,
      costValue: srdEquipment.costValue,
      costUnit: srdEquipment.costUnit,
    })
    .from(srdEquipment)
    .orderBy(asc(srdEquipment.name))
    .all();
}

export function magicItemsForTreasure() {
  return db
    .select({ slug: srdMagicItems.slug, name: srdMagicItems.name, rarity: srdMagicItems.rarity })
    .from(srdMagicItems)
    .all();
}

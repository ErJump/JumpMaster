import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { srdMagicItems, srdEquipment } from '@/db/schema';
import type { SrdMagicItemData, SrdEquipmentData } from '@/lib/srd-types';

/**
 * Oggetti magici ed equipaggiamento vivono in due tabelle ma il DM li cerca insieme
 * ("dove trovo la corda?"). Li uniamo in un solo elenco prefissando lo slug con la
 * provenienza, così due oggetti omonimi nelle due tabelle non si sovrappongono.
 */
export type ItemKind = 'magico' | 'equipaggiamento';

export interface ItemListItem {
  slug: string;
  name: string;
  kind: ItemKind;
  meta: string;
  badge: string;
  rarityRank: number;
}

const MAGIC_PREFIX = 'm-';
const EQUIPMENT_PREFIX = 'e-';

export function listItems(): ItemListItem[] {
  const magic = db
    .select({
      slug: srdMagicItems.slug,
      name: srdMagicItems.name,
      category: srdMagicItems.category,
      rarity: srdMagicItems.rarity,
      rarityRank: srdMagicItems.rarityRank,
    })
    .from(srdMagicItems)
    .all()
    .map((row) => ({
      slug: `${MAGIC_PREFIX}${row.slug}`,
      name: row.name,
      kind: 'magico' as const,
      meta: `${row.category} · ${row.rarity}`,
      badge: row.rarity,
      rarityRank: row.rarityRank,
    }));

  const equipment = db
    .select({
      slug: srdEquipment.slug,
      name: srdEquipment.name,
      category: srdEquipment.category,
      subcategory: srdEquipment.subcategory,
      costValue: srdEquipment.costValue,
      costUnit: srdEquipment.costUnit,
    })
    .from(srdEquipment)
    .all()
    .map((row) => ({
      slug: `${EQUIPMENT_PREFIX}${row.slug}`,
      name: row.name,
      kind: 'equipaggiamento' as const,
      meta: [row.subcategory ?? row.category, row.costValue ? `${row.costValue} ${row.costUnit}` : null]
        .filter(Boolean)
        .join(' · '),
      badge: row.category,
      rarityRank: -1,
    }));

  return [...magic, ...equipment].sort((a, b) => a.name.localeCompare(b.name, 'it'));
}

export type ItemDetail =
  | { kind: 'magico'; name: string; rarity: string; category: string; description: string; data: SrdMagicItemData }
  | { kind: 'equipaggiamento'; name: string; category: string; data: SrdEquipmentData };

export function getItem(prefixedSlug: string): ItemDetail | undefined {
  if (prefixedSlug.startsWith(MAGIC_PREFIX)) {
    const row = db
      .select()
      .from(srdMagicItems)
      .where(eq(srdMagicItems.slug, prefixedSlug.slice(MAGIC_PREFIX.length)))
      .get();
    if (!row) return undefined;
    return {
      kind: 'magico',
      name: row.name,
      rarity: row.rarity,
      category: row.category,
      description: row.description,
      data: row.data as SrdMagicItemData,
    };
  }

  if (prefixedSlug.startsWith(EQUIPMENT_PREFIX)) {
    const row = db
      .select()
      .from(srdEquipment)
      .where(eq(srdEquipment.slug, prefixedSlug.slice(EQUIPMENT_PREFIX.length)))
      .get();
    if (!row) return undefined;
    return {
      kind: 'equipaggiamento',
      name: row.name,
      category: row.category,
      data: row.data as SrdEquipmentData,
    };
  }

  return undefined;
}

export function itemFacets(): { rarities: string[]; categories: string[] } {
  const rarities = db
    .selectDistinct({ rarity: srdMagicItems.rarity, rank: srdMagicItems.rarityRank })
    .from(srdMagicItems)
    .orderBy(asc(srdMagicItems.rarityRank))
    .all()
    .map((row) => row.rarity);

  const categories = db
    .selectDistinct({ category: srdEquipment.category })
    .from(srdEquipment)
    .orderBy(asc(srdEquipment.category))
    .all()
    .map((row) => row.category);

  return { rarities, categories };
}

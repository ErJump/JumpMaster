import { PageHeader } from '@/ui/components/primitives';
import { BrowserLayout } from '@/ui/components/BrowserLayout';
import { CompendiumBrowser } from '@/ui/components/CompendiumBrowser';
import { listItems, itemFacets } from '@/features/items/queries';
import type { BadgeTone } from '@/ui/components/primitives';

/** La rarità ha un colore, come nei videogiochi: si riconosce prima di leggerla. */
const RARITY_TONE: Record<string, BadgeTone> = {
  Common: 'neutral',
  Uncommon: 'bottle',
  Rare: 'gold',
  'Very Rare': 'arcane',
  Legendary: 'wax',
  Artifact: 'wax',
};

export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  const items = listItems();
  const { rarities, categories } = itemFacets();

  const browserItems = items.map((item) => ({
    slug: item.slug,
    name: item.name,
    meta: item.meta,
    badge: { label: item.badge, tone: RARITY_TONE[item.badge] ?? 'neutral', title: item.kind },
    facets: { kind: item.kind, rarity: item.kind === 'magico' ? item.badge : '', category: item.badge },
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Oggetti"
        count={items.length}
        subtitle="Oggetti magici ed equipaggiamento insieme: cerca per nome o filtra per rarità."
      />
      <BrowserLayout
        browser={
          <CompendiumBrowser
            items={browserItems}
            basePath="/oggetti"
            placeholder={`Cerca fra ${items.length} oggetti…`}
            filters={[
              {
                key: 'kind',
                label: 'Tipo',
                options: [
                  { value: 'magico', label: 'Magici' },
                  { value: 'equipaggiamento', label: 'Equipaggiamento' },
                ],
              },
              { key: 'rarity', label: 'Rarità', options: rarities.map((r) => ({ value: r, label: r })) },
              { key: 'category', label: 'Categoria', options: categories.map((c) => ({ value: c, label: c })) },
            ]}
          />
        }
      >
        {children}
      </BrowserLayout>
    </div>
  );
}

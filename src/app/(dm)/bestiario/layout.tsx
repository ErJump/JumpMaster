import { PageHeader } from '@/ui/components/primitives';
import { BrowserLayout } from '@/ui/components/BrowserLayout';
import { CompendiumBrowser } from '@/ui/components/CompendiumBrowser';
import { listMonsters, monsterFacets } from '@/features/bestiary/queries';

/**
 * L'elenco vive nel layout, non nella pagina: così resta montato mentre si passa da un
 * mostro all'altro. Ricerca e filtri non si azzerano, e il passaggio è istantaneo —
 * che al tavolo è esattamente ciò che serve.
 */
export default function BestiaryLayout({ children }: { children: React.ReactNode }) {
  const monsters = listMonsters();
  const { types, sizes, crs } = monsterFacets();

  const items = monsters.map((monster) => ({
    slug: monster.slug,
    name: monster.name,
    meta: `${monster.size} ${monster.type} · ${monster.alignment}`,
    badge: { label: monster.crLabel, tone: 'wax' as const, title: `Grado di Sfida ${monster.crLabel}` },
    facets: { cr: monster.crLabel, type: monster.type, size: monster.size },
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Bestiario"
        count={monsters.length}
        subtitle="Cerca per nome o filtra per grado di sfida, tipo e taglia."
      />
      <BrowserLayout
        browser={
          <CompendiumBrowser
            items={items}
            basePath="/bestiario"
            placeholder={`Cerca fra ${monsters.length} mostri…`}
            filters={[
              { key: 'cr', label: 'GS', options: crs.map((entry) => ({ value: entry.label, label: entry.label })) },
              { key: 'type', label: 'Tipo', options: types.map((type) => ({ value: type, label: type })) },
              { key: 'size', label: 'Taglia', options: sizes.map((size) => ({ value: size, label: size })) },
            ]}
          />
        }
      >
        {children}
      </BrowserLayout>
    </div>
  );
}

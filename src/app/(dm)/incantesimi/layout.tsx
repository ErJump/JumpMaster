import { PageHeader } from '@/ui/components/primitives';
import { BrowserLayout } from '@/ui/components/BrowserLayout';
import { CompendiumBrowser } from '@/ui/components/CompendiumBrowser';
import { listSpells, spellFacets } from '@/features/spells/queries';

export default function SpellsLayout({ children }: { children: React.ReactNode }) {
  const spells = listSpells();
  const { levels, schools, classes } = spellFacets();

  const items = spells.map((spell) => ({
    slug: spell.slug,
    name: spell.name,
    meta: `${spell.levelLabel} · ${spell.school}${spell.concentration ? ' · concentrazione' : ''}${spell.ritual ? ' · rituale' : ''}`,
    badge: { label: spell.level === 0 ? 'T' : String(spell.level), tone: 'arcane' as const, title: spell.levelLabel },
    // Il filtro per classe confronta l'intera stringa: qui teniamo la lista completa
    // e la ricerca testuale copre il caso "quali incantesimi ha il chierico".
    facets: { level: spell.levelLabel, school: spell.school },
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Incantesimi"
        count={spells.length}
        subtitle={`Cerca per nome o filtra per livello e scuola. ${classes.length} classi incantatrici.`}
      />
      <BrowserLayout
        browser={
          <CompendiumBrowser
            items={items}
            basePath="/incantesimi"
            placeholder={`Cerca fra ${spells.length} incantesimi…`}
            filters={[
              { key: 'level', label: 'Livello', options: levels },
              { key: 'school', label: 'Scuola', options: schools.map((school) => ({ value: school, label: school })) },
            ]}
          />
        }
      >
        {children}
      </BrowserLayout>
    </div>
  );
}

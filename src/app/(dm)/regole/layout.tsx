import { PageHeader } from '@/ui/components/primitives';
import { SetupNeeded } from '@/ui/components/SetupNeeded';
import { BrowserLayout } from '@/ui/components/BrowserLayout';
import { CompendiumBrowser } from '@/ui/components/CompendiumBrowser';
import { listRules } from '@/features/rules/queries';

export default function RulesLayout({ children }: { children: React.ReactNode }) {
  const rules = listRules();

  const items = rules.map((rule) => ({
    slug: rule.slug,
    name: rule.name,
    meta: rule.excerpt,
    badge:
      rule.kind === 'condizione'
        ? { label: 'condizione', tone: 'wax' as const }
        : { label: 'regola', tone: 'neutral' as const },
    facets: { kind: rule.kind },
    searchText: rule.searchText,
  }));

  if (rules.length === 0) return <SetupNeeded what="il prontuario delle regole" />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Regole rapide"
        count={rules.length}
        subtitle="Cerca in italiano anche se le regole sono in inglese, e dentro il testo e non solo nei titoli: prova «copertura», «prono», «riposo»."
      />
      <BrowserLayout
        browser={
          <CompendiumBrowser
            items={items}
            basePath="/regole"
            placeholder="Cerca dentro le regole…"
            filters={[
              {
                key: 'kind',
                label: 'Tipo',
                options: [
                  { value: 'regola', label: 'Regole' },
                  { value: 'condizione', label: 'Condizioni' },
                ],
              },
            ]}
          />
        }
      >
        {children}
      </BrowserLayout>
    </div>
  );
}

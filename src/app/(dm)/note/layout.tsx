import { PageHeader } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { BrowserLayout } from '@/ui/components/BrowserLayout';
import { CompendiumBrowser } from '@/ui/components/CompendiumBrowser';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { listNotes } from '@/features/notes/queries';
import { NOTE_KIND_INFO, noteKinds } from '@/features/notes/schema';

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Il taccuino delle note" />;

  const notes = listNotes(campaign.id);
  const items = notes.map((note) => ({
    slug: String(note.id),
    name: note.title,
    meta: `${NOTE_KIND_INFO[note.kind].icon} ${NOTE_KIND_INFO[note.kind].label}`,
    facets: { kind: note.kind },
    // La ricerca guarda anche dentro il testo: «chi parlava del culto?»
    searchText: note.body,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Note"
        count={notes.length || undefined}
        subtitle={`${campaign.name} — luoghi, fazioni, misteri. Scrivi [[Titolo]] per collegarle.`}
        actions={<ButtonLink href="/note/nuova">Nuova nota</ButtonLink>}
      />
      <BrowserLayout
        browser={
          <CompendiumBrowser
            items={items}
            basePath="/note"
            placeholder="Cerca nei titoli e nel testo…"
            filters={[{ key: 'kind', label: 'Categoria', options: noteKinds.map((k) => ({ value: k, label: NOTE_KIND_INFO[k].label })) }]}
          />
        }
      >
        {children}
      </BrowserLayout>
    </div>
  );
}

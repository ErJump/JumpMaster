import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Panel, Badge } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { Markdown } from '@/ui/components/Markdown';
import { getNote } from '@/features/notes/queries';
import { NOTE_KIND_INFO } from '@/features/notes/schema';
import { linkTargets, mentionsOf, resolveLinkIn } from '@/db/queries/links';

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = getNote(Number(id));
  if (!note) notFound();

  const targets = linkTargets(note.campaignId);
  const mentions = mentionsOf(note.campaignId, note.title);
  const resolve = (target: string) => resolveLinkIn(targets, target);

  return (
    <div className="max-w-3xl space-y-6">
      <Panel className="border-l-gold border-l-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-gold text-3xl leading-tight">{note.title}</h2>
          <div className="flex items-center gap-2">
            <Badge>
              {NOTE_KIND_INFO[note.kind].icon} {NOTE_KIND_INFO[note.kind].label}
            </Badge>
            <ButtonLink href={`/note/${note.id}/modifica`} variant="ghost">
              Modifica
            </ButtonLink>
          </div>
        </div>
        <hr className="rule-gold my-4" />
        {note.body.trim() ? (
          <Markdown source={note.body} resolveLink={resolve} />
        ) : (
          <p className="text-ink-faint italic">Nota ancora vuota.</p>
        )}
      </Panel>

      <Panel className="p-5">
        <h3 className="small-caps text-gold mb-2 text-lg">Chi la cita</h3>
        {mentions.notes.length === 0 && mentions.sessions.length === 0 && mentions.maps.length === 0 ? (
          <p className="text-ink-faint text-base">
            Nessuna nota o sessione cita «{note.title}». Scrivi <code className="font-mono">[[{note.title}]]</code> in
            un’altra nota per collegarla.
          </p>
        ) : (
          <ul className="space-y-1">
            {mentions.notes.map((m) => (
              <li key={`n${m.id}`}>
                <Link href={`/note/${m.id}`} className="text-ink hover:text-gold text-base">
                  📜 {m.title}
                </Link>
              </li>
            ))}
            {mentions.maps.map((m) => (
              <li key={`m${m.id}`}>
                <Link href={`/mappe/${m.id}`} className="text-ink hover:text-gold text-base">
                  🗺 {m.name}
                </Link>
              </li>
            ))}
            {mentions.sessions.map((m) => (
              <li key={`s${m.id}`}>
                <Link href={`/sessioni/${m.id}`} className="text-ink hover:text-gold text-base">
                  🗓 Sessione {m.number}
                  {m.title ? ` — ${m.title}` : ''}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

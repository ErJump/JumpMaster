import { notFound } from 'next/navigation';
import { Panel } from '@/ui/components/primitives';
import { Button } from '@/ui/components/Button';
import { getNote } from '@/features/notes/queries';
import { updateNote, deleteNote } from '@/features/notes/actions';
import { NoteForm } from '@/features/notes/components/NoteForm';

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = getNote(Number(id));
  if (!note) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <Panel className="p-6">
        <h2 className="text-gold mb-1 text-2xl">Modifica «{note.title}»</h2>
        <p className="text-ink-faint mb-4 text-sm">
          Se cambi il titolo, i collegamenti che la citano nelle altre note e nelle sessioni si aggiornano da soli.
        </p>
        <NoteForm action={updateNote.bind(null, note.id)} note={note} submitLabel="Salva" />
      </Panel>
      <form action={deleteNote.bind(null, note.id)}>
        <Button type="submit" variant="danger">
          Elimina la nota
        </Button>
      </form>
    </div>
  );
}

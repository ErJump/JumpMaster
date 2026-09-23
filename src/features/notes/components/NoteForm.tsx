'use client';

import { useActionState } from 'react';
import { Button } from '@/ui/components/Button';
import { Field, TextInput, TextArea, Select } from '@/ui/components/Field';
import { NOTE_KIND_INFO, noteKinds } from '../schema';
import type { NoteFormState } from '../actions';
import type { Note } from '@/db/schema';

export function NoteForm({
  action,
  note,
  defaultTitle = '',
  submitLabel,
}: {
  action: (previous: NoteFormState, formData: FormData) => Promise<NoteFormState>;
  note?: Note;
  defaultTitle?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<NoteFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
        <Field label="Titolo" error={state.errors?.title}>
          <TextInput name="title" defaultValue={note?.title ?? defaultTitle} placeholder="Villaggio di Barovia" autoFocus required />
        </Field>
        <Field label="Categoria" error={state.errors?.kind}>
          <Select name="kind" defaultValue={note?.kind ?? 'other'}>
            {noteKinds.map((kind) => (
              <option key={kind} value={kind}>
                {NOTE_KIND_INFO[kind].icon} {NOTE_KIND_INFO[kind].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Testo"
        hint="Scrivi [[Titolo]] per collegare un'altra nota o un personaggio — anche se non esiste ancora: la creerai con un clic. Funziona il markdown: ## titoli, - elenchi, **grassetto**."
        error={state.errors?.body}
      >
        <TextArea name="body" rows={16} defaultValue={note?.body ?? ''} className="font-mono text-base leading-relaxed" />
      </Field>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvo…' : submitLabel}
        </Button>
        {state.errors?.form && <span role="alert" className="text-wax text-base">{state.errors.form}</span>}
      </div>
    </form>
  );
}

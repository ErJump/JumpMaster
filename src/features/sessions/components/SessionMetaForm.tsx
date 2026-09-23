'use client';

import { useActionState } from 'react';
import { Button } from '@/ui/components/Button';
import { Field, TextInput } from '@/ui/components/Field';
import type { MetaState } from '../actions';

export function SessionMetaForm({
  action,
  title,
  playedOn,
}: {
  action: (previous: MetaState, formData: FormData) => Promise<MetaState>;
  title: string;
  playedOn: string | null;
}) {
  const [state, formAction, pending] = useActionState<MetaState, FormData>(action, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <div className="min-w-64 flex-1">
        <Field label="Titolo della sessione">
          <TextInput name="title" defaultValue={title} placeholder="La nebbia di Barovia" />
        </Field>
      </div>
      <Field label="Giocata il">
        <TextInput type="date" name="playedOn" defaultValue={playedOn ?? ''} />
      </Field>
      <Button type="submit" variant="ghost" disabled={pending}>
        {pending ? 'Salvo…' : 'Salva'}
      </Button>
      {state.error && <span role="alert" className="text-wax text-base">{state.error}</span>}
      {state.message && <span className="text-bottle text-base">{state.message}</span>}
    </form>
  );
}

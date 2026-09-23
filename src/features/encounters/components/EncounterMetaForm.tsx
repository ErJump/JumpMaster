'use client';

import { useActionState } from 'react';
import { Button } from '@/ui/components/Button';
import { Field, TextInput, TextArea } from '@/ui/components/Field';
import type { FormState } from '../actions';
import type { Encounter } from '@/db/schema';

export function EncounterMetaForm({
  action,
  encounter,
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  encounter?: Encounter;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Nome" error={state.errors?.name}>
        <TextInput
          name="name"
          defaultValue={encounter?.name ?? ''}
          placeholder="Imboscata sulla Vecchia Strada Svalich"
          autoFocus={!encounter}
          required
        />
      </Field>
      <Field label="Situazione" hint="Dove, come comincia, cosa vogliono i mostri." error={state.errors?.description}>
        <TextArea name="description" rows={3} defaultValue={encounter?.description ?? ''} />
      </Field>
      <Field label="Appunti tattici" hint="Solo per te: come combattono, quando scappano." error={state.errors?.notes}>
        <TextArea name="notes" rows={3} defaultValue={encounter?.notes ?? ''} />
      </Field>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvo…' : submitLabel}
        </Button>
        {state.message && <span className="text-bottle text-base">{state.message}</span>}
      </div>
    </form>
  );
}

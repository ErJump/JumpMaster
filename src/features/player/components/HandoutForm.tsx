'use client';

import { useActionState, useRef } from 'react';
import { Button } from '@/ui/components/Button';
import { Field, TextInput, TextArea } from '@/ui/components/Field';
import type { HandoutFormState } from '../actions';

export function HandoutForm({ action }: { action: (previous: HandoutFormState, formData: FormData) => Promise<HandoutFormState> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<HandoutFormState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (!result.error) formRef.current?.reset();
    return result;
  }, {});

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field label="Titolo">
        <TextInput name="title" placeholder="Lettera del borgomastro" required />
      </Field>
      <Field label="Testo" hint="Ciò che i giocatori leggeranno. Va bene anche vuoto, se c'è un'immagine.">
        <TextArea name="body" rows={4} />
      </Field>
      <Field label="Immagine" hint="PNG, JPEG, WebP o GIF, fino a 10 MB. Resta sul tuo PC.">
        <input
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="text-ink-soft file:border-border-strong file:text-ink file:bg-surface-raised block w-full text-base file:mr-3 file:rounded-xs file:border file:px-3 file:py-1.5"
        />
      </Field>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvo…' : 'Prepara l’handout'}
        </Button>
        {state.error && <span role="alert" className="text-wax text-base">{state.error}</span>}
        {state.message && <span className="text-bottle text-base">{state.message}</span>}
      </div>
    </form>
  );
}

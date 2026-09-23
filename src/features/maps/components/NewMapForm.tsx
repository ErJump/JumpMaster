'use client';

import { useActionState } from 'react';
import { Button } from '@/ui/components/Button';
import { Field, TextInput } from '@/ui/components/Field';
import type { NewMapState } from '../actions';

export function NewMapForm({ action, defaultKind }: { action: (p: NewMapState, f: FormData) => Promise<NewMapState>; defaultKind: 'battle' | 'world' }) {
  const [state, formAction, pending] = useActionState<NewMapState, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-5">
      <Field label="Nome">
        <TextInput name="name" placeholder={defaultKind === 'battle' ? 'La cripta sotto la chiesa' : 'La valle di Barovia'} autoFocus required />
      </Field>
      <fieldset className="flex flex-wrap gap-5">
        <legend className="small-caps text-gold mb-1 text-base font-semibold">Tipo</legend>
        <label className="text-ink flex items-center gap-2 text-base">
          <input type="radio" name="kind" value="battle" defaultChecked={defaultKind === 'battle'} className="accent-[var(--jm-gold)]" />
          ⚔ Tattica — griglia, segnalini, nebbia
        </label>
        <label className="text-ink flex items-center gap-2 text-base">
          <input type="radio" name="kind" value="world" defaultChecked={defaultKind === 'world'} className="accent-[var(--jm-gold)]" />
          🗺 Del mondo — luoghi collegati alle note
        </label>
      </fieldset>
      <Field label="Immagine" hint="PNG, JPEG, WebP o GIF, fino a 10 MB. Resta sul tuo PC.">
        <input
          type="file"
          name="image"
          required
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="text-ink-soft file:border-border-strong file:text-ink file:bg-surface-raised block w-full text-base file:mr-3 file:rounded-xs file:border file:px-3 file:py-1.5"
        />
      </Field>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? 'Carico…' : 'Crea la mappa'}</Button>
        {state.error && <span role="alert" className="text-wax text-base">{state.error}</span>}
      </div>
    </form>
  );
}

'use client';

import { useActionState } from 'react';
import { Button } from '@/ui/components/Button';
import { Field, TextInput, TextArea, Select } from '@/ui/components/Field';
import { CAMPAIGN_STATUS_LABELS, campaignStatuses } from '../schema';
import type { FormState } from '../actions';
import type { Campaign } from '@/db/schema';

export function CampaignForm({
  action,
  campaign,
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  campaign?: Campaign;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Nome" error={state.errors?.name}>
        <TextInput
          name="name"
          defaultValue={campaign?.name ?? ''}
          placeholder="La Maledizione di Strahd"
          autoFocus={!campaign}
          required
        />
      </Field>

      <Field label="Ambientazione" hint="Dove si svolge: un mondo ufficiale o il tuo." error={state.errors?.setting}>
        <TextInput name="setting" defaultValue={campaign?.setting ?? ''} placeholder="Forgotten Realms" />
      </Field>

      <Field
        label="Premessa"
        hint="Il tono e il punto di partenza. Serve a te per non perdere il filo fra una sessione e l'altra."
        error={state.errors?.description}
      >
        <TextArea name="description" rows={4} defaultValue={campaign?.description ?? ''} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Livello del gruppo"
          hint="Serve a calcolare gli scontri."
          error={state.errors?.partyLevel}
        >
          <TextInput type="number" name="partyLevel" min={1} max={20} defaultValue={campaign?.partyLevel ?? 1} />
        </Field>

        <Field label="Sessioni giocate" error={state.errors?.sessionCount}>
          <TextInput type="number" name="sessionCount" min={0} defaultValue={campaign?.sessionCount ?? 0} />
        </Field>

        <Field label="Stato" error={state.errors?.status}>
          <Select name="status" defaultValue={campaign?.status ?? 'active'}>
            {campaignStatuses.map((status) => (
              <option key={status} value={status}>
                {CAMPAIGN_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Appunti del DM"
        hint="Privati. Non finiranno mai nella Vista Giocatori."
        error={state.errors?.dmNotes}
      >
        <TextArea name="dmNotes" rows={6} defaultValue={campaign?.dmNotes ?? ''} />
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

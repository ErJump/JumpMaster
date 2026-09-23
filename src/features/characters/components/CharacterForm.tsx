'use client';

import { useActionState } from 'react';
import { Button } from '@/ui/components/Button';
import { Field, TextInput, TextArea, Select } from '@/ui/components/Field';
import { AbilityScoreGrid } from './AbilityScoreGrid';
import { SkillGrid } from './SkillGrid';
import { DISPOSITION_LABELS, dispositions } from '../schema';
import type { FormState } from '../actions';
import type { Character } from '@/db/schema';
import type { Ability } from '@/core/rules';

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

export function CharacterForm({
  action,
  kind,
  character,
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  kind: 'pc' | 'npc';
  character?: Character;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="kind" value={kind} />

      {kind === 'pc' ? (
        <PcFields character={character} errors={state.errors} />
      ) : (
        <NpcFields character={character} errors={state.errors} />
      )}

      <Field label="Appunti" error={state.errors?.notes}>
        <TextArea name="notes" rows={4} defaultValue={character?.notes ?? ''} />
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

function PcFields({ character, errors }: { character?: Character; errors?: Record<string, string> }) {
  const scores: Record<Ability, number> = {
    str: character?.str ?? 10,
    dex: character?.dex ?? 10,
    con: character?.con ?? 10,
    int: character?.int ?? 10,
    wis: character?.wis ?? 10,
    cha: character?.cha ?? 10,
  };

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome del personaggio" error={errors?.name}>
          <TextInput name="name" defaultValue={character?.name ?? ''} placeholder="Elara Ventoluna" autoFocus required />
        </Field>
        <Field label="Giocatore" error={errors?.playerName}>
          <TextInput name="playerName" defaultValue={character?.playerName ?? ''} placeholder="Marco" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <Field label="Razza" error={errors?.race}>
          <TextInput name="race" defaultValue={character?.race ?? ''} placeholder="Elfo" />
        </Field>
        <Field label="Classe" error={errors?.className}>
          <TextInput name="className" defaultValue={character?.className ?? ''} placeholder="Mago" />
        </Field>
        <Field label="Sottoclasse" error={errors?.subclass}>
          <TextInput name="subclass" defaultValue={character?.subclass ?? ''} placeholder="Evocazione" />
        </Field>
        <Field label="Livello" error={errors?.level}>
          <TextInput type="number" name="level" min={1} max={20} defaultValue={character?.level ?? 1} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Classe Armatura" hint="Il numero da superare per colpirlo." error={errors?.ac}>
          <TextInput type="number" name="ac" min={1} max={40} defaultValue={character?.ac ?? 10} />
        </Field>
        <Field label="Punti ferita massimi" error={errors?.maxHp}>
          <TextInput type="number" name="maxHp" min={1} max={999} defaultValue={character?.maxHp ?? 1} />
        </Field>
        <Field label="Velocità" hint="In piedi." error={errors?.speed}>
          <TextInput type="number" name="speed" min={0} max={999} defaultValue={character?.speed ?? 30} />
        </Field>
      </div>

      <div>
        <h3 className="small-caps text-gold mb-1 text-lg">Caratteristiche</h3>
        <p className="text-ink-faint mb-3 text-sm">
          Copia i sei punteggi dalla scheda: modificatori, tiri salvezza, iniziativa e punteggi
          passivi li calcola l’app. Spunta <strong>TS</strong> dove il personaggio è competente nel
          tiro salvezza.
        </p>
        <AbilityScoreGrid defaults={scores} saveProficiencies={list(character?.saveProficiencies)} />
      </div>

      <div>
        <h3 className="small-caps text-gold mb-1 text-lg">Abilità</h3>
        <p className="text-ink-faint mb-3 text-sm">
          Servono soprattutto per la <strong>Percezione passiva</strong>, il numero che consulti di
          continuo. L’<em>esperienza</em> raddoppia il bonus di competenza.
        </p>
        <SkillGrid
          proficient={list(character?.skillProficiencies)}
          expertise={list(character?.skillExpertise)}
        />
      </div>
    </>
  );
}

function NpcFields({ character, errors }: { character?: Character; errors?: Record<string, string> }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" error={errors?.name}>
          <TextInput name="name" defaultValue={character?.name ?? ''} placeholder="Ireena Kolyana" autoFocus required />
        </Field>
        <Field label="Ruolo" hint="Chi è, in due parole." error={errors?.role}>
          <TextInput name="role" defaultValue={character?.role ?? ''} placeholder="Figlia del borgomastro" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Dove si trova" error={errors?.location}>
          <TextInput name="location" defaultValue={character?.location ?? ''} placeholder="Villaggio di Barovia" />
        </Field>
        <Field label="Atteggiamento verso il gruppo" error={errors?.disposition}>
          <Select name="disposition" defaultValue={character?.disposition ?? 'unknown'}>
            {dispositions.map((value) => (
              <option key={value} value={value}>
                {DISPOSITION_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Aspetto" hint="Come lo descrivi la prima volta." error={errors?.appearance}>
        <TextArea name="appearance" rows={2} defaultValue={character?.appearance ?? ''} />
      </Field>

      <Field
        label="Voce e modi"
        hint="Un appiglio per interpretarlo: un accento, un tic, una parola che ripete."
        error={errors?.voice}
      >
        <TextArea name="voice" rows={2} defaultValue={character?.voice ?? ''} />
      </Field>

      <div className="panel border-l-wax border-l-4 p-4">
        <Field
          label="⚠️ Segreto"
          hint="Solo per i tuoi occhi. Non finirà mai nella Vista Giocatori."
          error={errors?.secret}
        >
          <TextArea name="secret" rows={3} defaultValue={character?.secret ?? ''} />
        </Field>
      </div>

      <Field
        label="Stat block dal bestiario"
        hint="Identificativo del mostro da usare se dovesse combattere, es. «bandit» o «veteran»."
        error={errors?.srdMonsterSlug}
      >
        <TextInput name="srdMonsterSlug" defaultValue={character?.srdMonsterSlug ?? ''} placeholder="bandit" />
      </Field>
    </>
  );
}

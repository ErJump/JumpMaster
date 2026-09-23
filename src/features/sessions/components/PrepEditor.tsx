'use client';

import { useState } from 'react';
import { PREP_STEPS, type PrepItem, type PrepStep, type Secret, type SessionPrep } from '@/core/sessions';
import { useAutosave, AUTOSAVE_LABEL } from '@/ui/hooks/useAutosave';

const newId = () => crypto.randomUUID();

/**
 * Gli otto passi della preparazione. Ogni modifica si salva da sola (SPEC-0010 AC10): niente
 * pulsante «Salva» da dimenticare prima di chiudere il portatile.
 */
export function PrepEditor({ initial, save }: { initial: SessionPrep; save: (prep: SessionPrep) => Promise<{ error?: string }> }) {
  const [prep, setPrep] = useState<SessionPrep>(initial);
  const { status, error, schedule } = useAutosave(save);

  function update(next: SessionPrep) {
    setPrep(next);
    schedule(next);
  }

  return (
    <div className="space-y-5">
      <p className="text-ink-faint sticky top-16 z-10 text-right text-sm" aria-live="polite">
        {error ?? AUTOSAVE_LABEL[status]}
      </p>

      {PREP_STEPS.map((step) => (
        <section key={step.key} className="panel p-5">
          <header className="mb-3 flex items-baseline gap-3">
            <span className="text-gold-soft font-mono text-2xl">{step.number}</span>
            <div>
              <h2 className="text-gold text-xl">{step.title}</h2>
              <p className="text-ink-soft text-base leading-relaxed">{step.why}</p>
            </div>
          </header>
          <StepField step={step} prep={prep} onChange={update} />
        </section>
      ))}
    </div>
  );
}

function StepField({ step, prep, onChange }: { step: PrepStep; prep: SessionPrep; onChange: (p: SessionPrep) => void }) {
  if (step.kind === 'text') {
    const key = step.key as 'characters' | 'strongStart';
    return (
      <textarea
        value={prep[key]}
        onChange={(event) => onChange({ ...prep, [key]: event.target.value })}
        placeholder={step.placeholder}
        rows={4}
        className="panel text-ink placeholder:text-ink-faint w-full px-3 py-2 text-base leading-relaxed outline-none focus:border-[var(--jm-gold-soft)]"
      />
    );
  }

  if (step.kind === 'secrets') {
    const secrets = prep.secrets;
    const set = (next: Secret[]) => onChange({ ...prep, secrets: next });
    return (
      <ItemList
        items={secrets}
        placeholder={step.placeholder}
        onAdd={() => set([...secrets, { id: newId(), text: '', revealed: false }])}
        onRemove={(id) => set(secrets.filter((s) => s.id !== id))}
        onText={(id, text) => set(secrets.map((s) => (s.id === id ? { ...s, text } : s)))}
        renderLead={(item) => {
          const secret = item as Secret;
          return (
            <input
              type="checkbox"
              checked={secret.revealed}
              onChange={(event) => set(secrets.map((s) => (s.id === secret.id ? { ...s, revealed: event.target.checked } : s)))}
              title="Rivelato ai giocatori"
              aria-label="Rivelato"
              className="mt-2.5 h-5 w-5 accent-[var(--jm-bottle)]"
            />
          );
        }}
        addLabel="Aggiungi un segreto"
      />
    );
  }

  const key = step.key as 'scenes' | 'locations' | 'npcs' | 'monsters' | 'rewards';
  const items = prep[key];
  const set = (next: PrepItem[]) => onChange({ ...prep, [key]: next });
  return (
    <ItemList
      items={items}
      placeholder={step.placeholder}
      onAdd={() => set([...items, { id: newId(), text: '' }])}
      onRemove={(id) => set(items.filter((i) => i.id !== id))}
      onText={(id, text) => set(items.map((i) => (i.id === id ? { ...i, text } : i)))}
      addLabel="Aggiungi"
    />
  );
}

function ItemList({
  items,
  placeholder,
  onAdd,
  onRemove,
  onText,
  renderLead,
  addLabel,
}: {
  items: PrepItem[];
  placeholder: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onText: (id: string, text: string) => void;
  renderLead?: (item: PrepItem) => React.ReactNode;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          {renderLead ? renderLead(item) : <span className="text-ink-faint mt-2 w-5 text-right font-mono">{index + 1}.</span>}
          <input
            value={item.text}
            onChange={(event) => onText(item.id, event.target.value)}
            placeholder={index === 0 ? placeholder : ''}
            // Una voce appena aggiunta prende il fuoco: si scrive subito.
            autoFocus={item.text === '' && index === items.length - 1}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onAdd();
              }
            }}
            className="panel text-ink placeholder:text-ink-faint flex-1 px-3 py-2 text-base outline-none focus:border-[var(--jm-gold-soft)]"
          />
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label="Togli"
            className="text-ink-faint hover:text-wax mt-1.5 px-2 text-lg"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="text-gold hover:text-gold small-caps rounded-xs border border-dashed border-[var(--jm-border-strong)] px-3 py-1.5 text-base hover:border-[var(--jm-gold-soft)]"
      >
        + {addLabel}
      </button>
      <p className="text-ink-faint text-sm">Invio aggiunge una voce. Scrivi [[Nome]] per collegare una nota o un personaggio.</p>
    </div>
  );
}

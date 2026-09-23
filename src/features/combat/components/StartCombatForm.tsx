import { Button } from '@/ui/components/Button';

/**
 * Avvio del combattimento da uno scontro (SPEC-0007 AC1–AC2).
 * Form nativo con Server Action: funziona anche prima che la pagina sia idratata.
 */
export function StartCombatForm({
  action,
  running,
  disabled,
}: {
  action: (formData: FormData) => Promise<void>;
  running: boolean;
  disabled: boolean;
}) {
  if (running) {
    return (
      <form action={action}>
        <Button type="submit" className="px-6 text-lg">
          ▶ Riprendi il combattimento
        </Button>
      </form>
    );
  }

  return (
    <form action={action} className="panel flex flex-wrap items-center gap-4 p-4">
      <fieldset className="flex flex-wrap items-center gap-4">
        <legend className="sr-only">Punti ferita dei mostri</legend>
        <label className="text-ink flex items-center gap-2 text-base">
          <input type="radio" name="hpMode" value="average" defaultChecked className="accent-[var(--jm-gold)]" />
          PF medi del manuale
        </label>
        <label className="text-ink flex items-center gap-2 text-base">
          <input type="radio" name="hpMode" value="rolled" className="accent-[var(--jm-gold)]" />
          Tira i PF dai dadi vita
        </label>
      </fieldset>
      <Button type="submit" disabled={disabled} className="ml-auto px-6 text-lg">
        ⚔ Avvia il combattimento
      </Button>
      {disabled && <p className="text-ink-faint w-full text-sm">Aggiungi almeno un mostro per cominciare.</p>}
    </form>
  );
}

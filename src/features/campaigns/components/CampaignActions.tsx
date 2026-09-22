'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/ui/components/Button';
import { deleteCampaign, setActiveCampaign } from '../actions';

export function ActivateButton({ id, isActive }: { id: number; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  if (isActive) {
    return (
      <span className="small-caps border-gold/50 text-gold inline-flex items-center rounded-xs border px-3 py-2 text-base">
        ✦ Attiva
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() => startTransition(() => setActiveCampaign(id))}
    >
      {pending ? 'Attivo…' : 'Rendi attiva'}
    </Button>
  );
}

/**
 * L'eliminazione chiede conferma **e dice cosa sparirà** (SPEC-0002 AC6):
 * tutto ciò che appartiene alla campagna se ne va con lei, e il DM deve saperlo
 * prima di cliccare, non dopo.
 */
export function DeleteCampaignButton({ id, name }: { id: number; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Elimina
      </Button>
    );
  }

  return (
    <div className="panel border-wax/60 space-y-3 p-4">
      <p className="text-ink text-base leading-relaxed">
        Elimino <strong>{name}</strong> e tutto ciò che le appartiene: personaggi, scontri, note e
        oggetti della campagna. <strong className="text-wax">Non si può annullare.</strong>
      </p>
      <div className="flex gap-3">
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => startTransition(() => deleteCampaign(id))}
        >
          {pending ? 'Elimino…' : 'Sì, elimina'}
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Annulla
        </Button>
      </div>
    </div>
  );
}

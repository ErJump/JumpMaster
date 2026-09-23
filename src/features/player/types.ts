import type { PublicCombat } from '@/core/events';

export type LiveMode = 'auto' | 'handout' | 'blackout';

export interface PublicRoll {
  text: string;
  /** Istante del tiro in millisecondi: la Vista lo mostra per qualche secondo. */
  at: number;
}

/**
 * Tutto ciò che arriva alla finestra dei giocatori. Nient'altro viaggia verso `/player`.
 *
 * Nota: il nome dello scontro **non** c'è. «Imboscata sulla Vecchia Strada» è un titolo del DM,
 * e mostrarlo rovinerebbe proprio la sorpresa che descrive.
 */
export type PlayerView =
  | { kind: 'idle'; campaign: string | null; roll: PublicRoll | null }
  | {
      kind: 'handout';
      campaign: string;
      roll: PublicRoll | null;
      handout: { title: string; body: string; imageUrl: string | null };
    }
  | { kind: 'combat'; campaign: string; roll: PublicRoll | null; combat: PublicCombat };

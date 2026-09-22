/**
 * Metadati di una feature. Ogni slice in `src/features/<nome>/` ne espone uno
 * dal proprio `feature.config.ts`, e il registro li raccoglie per generare la navigazione.
 *
 * È il meccanismo che rende vero il requisito di scalabilità (ADR-0004):
 * aggiungere una feature = creare una cartella + una riga nel registro.
 */
export interface FeatureConfig {
  /** Combacia col nome della cartella e con `docs/specs/index.json` (verificato dal guard, regola R1). */
  id: string;
  /** Etichetta in italiano per la navigazione. */
  title: string;
  /** Una riga che spiega a cosa serve: compare nella home e nei suggerimenti. */
  description: string;
  href: string;
  /** Glifo mostrato nella navigazione. */
  icon: string;
  group: FeatureGroup;
  order: number;
  /**
   * Se `true`, la feature non ha senso senza una campagna attiva e la UI lo spiega
   * invece di rompersi (SPEC-0002 AC8).
   */
  requiresCampaign: boolean;
}

export type FeatureGroup = 'campagna' | 'compendio' | 'tavolo' | 'strumenti';

export const FEATURE_GROUPS: Record<FeatureGroup, { label: string; order: number }> = {
  campagna: { label: 'Campagna', order: 0 },
  tavolo: { label: 'Al tavolo', order: 1 },
  compendio: { label: 'Compendio', order: 2 },
  strumenti: { label: 'Strumenti', order: 3 },
};

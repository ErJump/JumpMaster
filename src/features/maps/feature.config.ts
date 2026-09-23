import type { FeatureConfig } from '../types';

export const mapsFeature: FeatureConfig = {
  id: 'maps',
  title: 'Mappe',
  description: 'Battlemap con segnalini e nebbia di guerra da mostrare ai giocatori, e la mappa del mondo coi luoghi collegati alle note.',
  href: '/mappe',
  icon: '🗺️',
  group: 'tavolo',
  order: 3,
  requiresCampaign: true,
};

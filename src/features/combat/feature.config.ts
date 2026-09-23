import type { FeatureConfig } from '../types';

export const combatFeature: FeatureConfig = {
  id: 'combat',
  title: 'Combattimento',
  description: 'Iniziativa, punti ferita, condizioni e tiri contro morte — con l’annulla quando sbagli in diretta.',
  href: '/combattimento',
  icon: '🩸',
  group: 'tavolo',
  order: 2,
  requiresCampaign: true,
};

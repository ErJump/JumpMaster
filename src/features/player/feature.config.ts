import type { FeatureConfig } from '../types';

export const playerFeature: FeatureConfig = {
  id: 'player',
  title: 'Regia',
  description: 'Cosa vedono i giocatori: combattimento, handout o schermo oscurato. Senza spoiler.',
  href: '/regia',
  icon: '📺',
  group: 'tavolo',
  order: 3,
  requiresCampaign: true,
};

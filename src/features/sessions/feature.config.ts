import type { FeatureConfig } from '../types';

export const sessionsFeature: FeatureConfig = {
  id: 'sessions',
  title: 'Sessioni',
  description: 'Prepara in otto passi alla Lazy DM, gioca, poi scrivi il diario. I segreti non scoperti passano alla prossima.',
  href: '/sessioni',
  icon: '🗓',
  group: 'campagna',
  order: 3,
  requiresCampaign: true,
};

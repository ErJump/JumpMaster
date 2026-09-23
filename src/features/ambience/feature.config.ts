import type { FeatureConfig } from '../types';

export const ambienceFeature: FeatureConfig = {
  id: 'ambience',
  title: 'Atmosfera',
  description: 'Pioggia, vento, fuoco, grotte: suoni di sottofondo in un clic, anche con la tua musica.',
  href: '/atmosfera',
  icon: '🎵',
  group: 'tavolo',
  order: 4,
  requiresCampaign: true,
};

import type { FeatureConfig } from '../types';

export const campaignsFeature: FeatureConfig = {
  id: 'campaigns',
  title: 'Campagne',
  description: 'Crea e gestisci le tue campagne. Tutto il resto vive dentro una di queste.',
  href: '/campagne',
  icon: '🏰',
  group: 'campagna',
  order: 0,
  requiresCampaign: false,
};

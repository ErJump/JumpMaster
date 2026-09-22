import type { FeatureConfig } from '../types';

export const bestiaryFeature: FeatureConfig = {
  id: 'bestiary',
  title: 'Bestiario',
  description: '334 mostri dell’SRD con stat block completi, filtrabili per grado di sfida e tipo.',
  href: '/bestiario',
  icon: '🐉',
  group: 'compendio',
  order: 0,
  requiresCampaign: false,
};

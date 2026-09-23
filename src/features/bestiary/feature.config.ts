import type { FeatureConfig } from '../types';

export const bestiaryFeature: FeatureConfig = {
  id: 'bestiary',
  title: 'Bestiario',
  description: 'I mostri dell’SRD e delle fonti aperte, con stat block completi, filtrabili per grado di sfida e tipo.',
  href: '/bestiario',
  icon: '🐉',
  group: 'compendio',
  order: 0,
  requiresCampaign: false,
};

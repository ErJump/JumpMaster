import type { FeatureConfig } from '../types';

export const sourcesFeature: FeatureConfig = {
  id: 'sources',
  title: 'Fonti aperte',
  description: 'Altri mostri da manuali con licenza aperta, scaricati una volta e poi usabili senza rete.',
  href: '/fonti',
  icon: '📚',
  group: 'compendio',
  order: 9,
  requiresCampaign: false,
};

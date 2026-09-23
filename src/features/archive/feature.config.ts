import type { FeatureConfig } from '../types';

export const archiveFeature: FeatureConfig = {
  id: 'archive',
  title: 'Archivio',
  description: 'Salva una campagna in un file, per non perderla mai, o riportane dentro una.',
  href: '/archivio',
  icon: '📦',
  group: 'strumenti',
  order: 9,
  requiresCampaign: false,
};

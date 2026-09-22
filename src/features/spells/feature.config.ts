import type { FeatureConfig } from '../types';

export const spellsFeature: FeatureConfig = {
  id: 'spells',
  title: 'Incantesimi',
  description: '319 incantesimi con tempo di lancio, gittata, componenti ed effetti ai livelli superiori.',
  href: '/incantesimi',
  icon: '✨',
  group: 'compendio',
  order: 1,
  requiresCampaign: false,
};

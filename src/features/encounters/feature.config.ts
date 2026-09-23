import type { FeatureConfig } from '../types';

export const encountersFeature: FeatureConfig = {
  id: 'encounters',
  title: 'Scontri',
  description: 'Prepara gli scontri prima della serata e scopri se rischiano di uccidere il gruppo.',
  href: '/scontri',
  icon: '⚔️',
  group: 'tavolo',
  order: 1,
  requiresCampaign: true,
};

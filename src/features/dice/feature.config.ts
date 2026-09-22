import type { FeatureConfig } from '../types';

export const diceFeature: FeatureConfig = {
  id: 'dice',
  title: 'Dadi',
  description: 'Notazione completa: vantaggio, tieni/scarta, danno dimezzato. Con i singoli dadi sempre in chiaro.',
  href: '/dadi',
  icon: '🎲',
  group: 'strumenti',
  order: 0,
  requiresCampaign: false,
};

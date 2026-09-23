import type { FeatureConfig } from '../types';

export const charactersFeature: FeatureConfig = {
  id: 'characters',
  title: 'Personaggi',
  description: 'Le schede dei giocatori e il registro dei PNG che il gruppo ha incontrato.',
  href: '/personaggi',
  icon: '🧙',
  group: 'campagna',
  order: 1,
  requiresCampaign: true,
};

export const partyFeature: FeatureConfig = {
  id: 'party',
  title: 'Il gruppo',
  description: 'CA, Percezione passiva e tiri salvezza di tutti, a colpo d’occhio. Smetti di chiedere.',
  href: '/gruppo',
  icon: '🛡️',
  group: 'tavolo',
  order: 0,
  requiresCampaign: true,
};

import type { FeatureConfig } from '../types';

export const glossaryFeature: FeatureConfig = {
  id: 'glossary',
  title: 'Glossario',
  description: 'I termini di gioco in italiano e in inglese. I dati dell’SRD sono in inglese: qui li traduci.',
  href: '/glossario',
  icon: '📖',
  group: 'strumenti',
  order: 1,
  requiresCampaign: false,
};

import type { FeatureConfig } from '../types';

export const rulesFeature: FeatureConfig = {
  id: 'rules',
  title: 'Regole rapide',
  description: 'Le 33 sezioni di regole e le 15 condizioni, cercabili a pieno testo. Per quando chiedono «si può fare?».',
  href: '/regole',
  icon: '⚖️',
  group: 'compendio',
  order: 3,
  requiresCampaign: false,
};

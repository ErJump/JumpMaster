import type { FeatureConfig } from '../types';

export const notesFeature: FeatureConfig = {
  id: 'notes',
  title: 'Note',
  description: 'Luoghi, fazioni, misteri. Scrivi [[Titolo]] e le note si collegano da sole.',
  href: '/note',
  icon: '📜',
  group: 'campagna',
  order: 2,
  requiresCampaign: true,
};

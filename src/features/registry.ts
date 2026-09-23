/**
 * Registro delle feature.
 *
 * Aggiungere una feature alla navigazione = **una riga qui**. Se ti trovi a dover
 * modificare molto altro, fermati: è il segnale che l'architettura va discussa
 * con un ADR (AGENTS.md §3).
 */
import { campaignsFeature } from './campaigns/feature.config';
import { charactersFeature, partyFeature } from './characters/feature.config';
import { encountersFeature } from './encounters/feature.config';
import { combatFeature } from './combat/feature.config';
import { playerFeature } from './player/feature.config';
import { mapsFeature } from './maps/feature.config';
import { notesFeature } from './notes/feature.config';
import { sessionsFeature } from './sessions/feature.config';
import { generatorsFeature } from './generators/feature.config';
import { bestiaryFeature } from './bestiary/feature.config';
import { spellsFeature } from './spells/feature.config';
import { itemsFeature } from './items/feature.config';
import { rulesFeature } from './rules/feature.config';
import { glossaryFeature } from './glossary/feature.config';
import { diceFeature } from './dice/feature.config';
import { FEATURE_GROUPS, type FeatureConfig, type FeatureGroup } from './types';

export const FEATURES: readonly FeatureConfig[] = [
  campaignsFeature,
  charactersFeature,
  notesFeature,
  sessionsFeature,
  partyFeature,
  encountersFeature,
  combatFeature,
  mapsFeature,
  playerFeature,
  bestiaryFeature,
  spellsFeature,
  itemsFeature,
  rulesFeature,
  glossaryFeature,
  diceFeature,
  generatorsFeature,
];

/** Le feature raggruppate e ordinate, come le mostra la navigazione. */
export function featuresByGroup(): Array<{ group: FeatureGroup; label: string; features: FeatureConfig[] }> {
  const groups = new Map<FeatureGroup, FeatureConfig[]>();

  for (const feature of FEATURES) {
    const bucket = groups.get(feature.group) ?? [];
    bucket.push(feature);
    groups.set(feature.group, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => FEATURE_GROUPS[a].order - FEATURE_GROUPS[b].order)
    .map(([group, features]) => ({
      group,
      label: FEATURE_GROUPS[group].label,
      features: features.sort((a, b) => a.order - b.order),
    }));
}

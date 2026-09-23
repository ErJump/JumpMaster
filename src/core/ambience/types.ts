/**
 * Scene d'atmosfera (SPEC-0016). ⚠ Modulo puro (invariante I1): qui il modello, il suono vero lo
 * fa il motore Web Audio in `features/ambience/engine`.
 */

export const SYNTH_SOUNDS = ['rain', 'wind', 'fire', 'drips', 'thunder', 'waves', 'crickets'] as const;
export type SynthSound = (typeof SYNTH_SOUNDS)[number];

export const SYNTH_LABELS: Record<SynthSound, { label: string; icon: string }> = {
  rain: { label: 'Pioggia', icon: '🌧' },
  wind: { label: 'Vento', icon: '🌬' },
  fire: { label: 'Fuoco', icon: '🔥' },
  drips: { label: 'Gocce in grotta', icon: '💧' },
  thunder: { label: 'Tuoni', icon: '⛈' },
  waves: { label: 'Onde', icon: '🌊' },
  crickets: { label: 'Grilli', icon: '🦗' },
};

/** Uno strato della scena: un suono generato o una traccia caricata dal DM. Volume da 0 a 1. */
export type Layer =
  | { id: string; kind: 'synth'; sound: SynthSound; volume: number }
  | { id: string; kind: 'track'; trackId: number; volume: number };

export interface SceneSpec {
  name: string;
  icon: string;
  layers: Layer[];
}

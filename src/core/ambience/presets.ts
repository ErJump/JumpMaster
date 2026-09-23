import type { Layer, SceneSpec, SynthSound } from './types';

const synth = (sound: SynthSound, volume: number): Layer => ({ id: sound, kind: 'synth', sound, volume });

/**
 * Le scene di base (SPEC-0016 AC1): coprono i luoghi più comuni di una campagna. Il DM le crea con
 * un clic e poi le cambia come vuole: diventano sue.
 */
export const BASE_SCENES: readonly SceneSpec[] = [
  { name: 'Tempesta', icon: '⛈', layers: [synth('rain', 0.8), synth('wind', 0.5), synth('thunder', 0.8)] },
  { name: 'Taverna sotto la pioggia', icon: '🍺', layers: [synth('fire', 0.6), synth('rain', 0.3)] },
  { name: 'Camino', icon: '🔥', layers: [synth('fire', 0.8)] },
  { name: 'Grotta', icon: '🕳', layers: [synth('drips', 0.8), synth('wind', 0.15)] },
  { name: 'Notte nel bosco', icon: '🌲', layers: [synth('crickets', 0.5), synth('wind', 0.25)] },
  { name: 'Riva del mare', icon: '🌊', layers: [synth('waves', 0.8), synth('wind', 0.3)] },
  { name: 'Passo di montagna', icon: '🏔', layers: [synth('wind', 0.9)] },
];

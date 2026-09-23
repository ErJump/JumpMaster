'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Layer } from '@/core/ambience';
import type { AmbienceMixer } from '../engine/mixer';

/**
 * L'atmosfera vive nel **layout** del pannello DM, non in una pagina (SPEC-0016 AC3): il layout
 * resta montato mentre si cambia pagina, e il suono con lui.
 */

export interface PlayableScene {
  id: number;
  name: string;
  icon: string;
  layers: Layer[];
}

export interface PlayableTrack {
  id: number;
  url: string;
}

interface AmbienceState {
  playing: Pick<PlayableScene, 'id' | 'name' | 'icon'> | null;
  volume: number;
  play(scene: PlayableScene, tracks: readonly PlayableTrack[]): Promise<void>;
  stop(): void;
  update(scene: PlayableScene, tracks: readonly PlayableTrack[]): void;
  setVolume(volume: number): void;
  /** Livello attuale dell'uscita, 0–1: per l'indicatore nella barra. */
  level(): number;
}

const AmbienceContext = createContext<AmbienceState | null>(null);

export function useAmbience(): AmbienceState {
  const context = useContext(AmbienceContext);
  if (!context) throw new Error('useAmbience fuori da <AmbienceProvider>');
  return context;
}

const trackUrlFrom = (tracks: readonly PlayableTrack[]) => {
  const byId = new Map(tracks.map((t) => [t.id, t.url]));
  return (id: number) => byId.get(id) ?? null;
};

export function AmbienceProvider({ children }: { children: React.ReactNode }) {
  const mixer = useRef<AmbienceMixer | null>(null);
  const [playing, setPlaying] = useState<AmbienceState['playing']>(null);
  const [volume, setVolumeState] = useState(0.8);

  // Il motore si carica al primo clic: il browser non lascia creare l'audio prima, e chi non usa
  // l'atmosfera non scarica nemmeno il codice dei sintetizzatori.
  const ensureMixer = useCallback(async () => {
    if (!mixer.current) {
      const { AmbienceMixer } = await import('../engine/mixer');
      mixer.current = new AmbienceMixer();
      mixer.current.setMasterVolume(volume);
      if (process.env.NODE_ENV !== 'production') (window as unknown as { __jumpmasterAmbience?: AmbienceMixer }).__jumpmasterAmbience = mixer.current;
    }
    return mixer.current;
  }, [volume]);

  useEffect(() => () => mixer.current?.close(), []);

  const value = useMemo<AmbienceState>(
    () => ({
      playing,
      volume,
      async play(scene, tracks) {
        const engine = await ensureMixer();
        await engine.play(scene.id, scene.layers, trackUrlFrom(tracks));
        setPlaying({ id: scene.id, name: scene.name, icon: scene.icon });
      },
      stop() {
        mixer.current?.stop();
        setPlaying(null);
      },
      update(scene, tracks) {
        mixer.current?.update(scene.id, scene.layers, trackUrlFrom(tracks));
        setPlaying((current) => (current?.id === scene.id ? { id: scene.id, name: scene.name, icon: scene.icon } : current));
      },
      setVolume(next) {
        setVolumeState(next);
        mixer.current?.setMasterVolume(next);
      },
      level: () => mixer.current?.level() ?? 0,
    }),
    [ensureMixer, playing, volume],
  );

  return <AmbienceContext.Provider value={value}>{children}</AmbienceContext.Provider>;
}

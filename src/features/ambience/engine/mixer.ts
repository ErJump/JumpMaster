/**
 * Il mixer dell'atmosfera (SPEC-0016): un `AudioContext`, una scena alla volta, dissolvenze a potenza
 * costante fra una scena e l'altra. Solo browser.
 */
import { crossfadeCurves, perceivedGain, type Layer } from '@/core/ambience';
import { startSynth, type Voice } from './synths';

export const CROSSFADE_SECONDS = 2.5;

interface LiveLayer {
  spec: Layer;
  gain: GainNode;
  voice: Voice;
}

interface LiveScene {
  id: number;
  bus: GainNode;
  layers: Map<string, LiveLayer>;
}

export type TrackUrl = (trackId: number) => string | null;

export class AmbienceMixer {
  readonly ctx: AudioContext;
  private readonly master: GainNode;
  /** Misura il livello in uscita: per la barra (si vede che suona) e per le prove. */
  readonly analyser: AnalyserNode;
  private current: LiveScene | null = null;
  private readonly fading = new Set<LiveScene>();

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'playback' });
    this.master = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.master.connect(this.analyser).connect(this.ctx.destination);
  }

  get sceneId(): number | null {
    return this.current?.id ?? null;
  }

  setMasterVolume(volume: number): void {
    this.master.gain.setTargetAtTime(perceivedGain(volume), this.ctx.currentTime, 0.05);
  }

  /** Fa partire una scena; se ne suona un'altra, dissolvenza incrociata. */
  async play(sceneId: number, layers: readonly Layer[], trackUrl: TrackUrl): Promise<void> {
    // I browser tengono il contesto sospeso finché non c'è un clic: `play` arriva sempre da uno.
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const scene: LiveScene = { id: sceneId, bus: this.ctx.createGain(), layers: new Map() };
    scene.bus.connect(this.master);
    for (const layer of layers) this.addLayer(scene, layer, trackUrl);

    const { fadeIn, fadeOut } = crossfadeCurves(128);
    const now = this.ctx.currentTime;
    scene.bus.gain.setValueCurveAtTime(Float32Array.from(fadeIn), now, CROSSFADE_SECONDS);

    const previous = this.current;
    this.current = scene;
    if (previous) this.fadeOutAndRelease(previous, Float32Array.from(fadeOut));
  }

  /** Ferma tutto, con una dissolvenza breve: uno stop secco al tavolo suona come un errore. */
  stop(): void {
    const previous = this.current;
    this.current = null;
    if (previous) this.fadeOutAndRelease(previous, Float32Array.from(crossfadeCurves(64).fadeOut), 1);
  }

  /**
   * Allinea la scena che suona agli strati appena modificati: volumi che cambiano, strati aggiunti o
   * tolti. Serve all'editor: il DM regola e sente subito.
   */
  update(sceneId: number, layers: readonly Layer[], trackUrl: TrackUrl): void {
    const scene = this.current;
    if (!scene || scene.id !== sceneId) return;
    const wanted = new Map(layers.map((layer) => [layer.id, layer]));

    for (const [id, live] of scene.layers) {
      const next = wanted.get(id);
      if (!next || !sameSource(next, live.spec)) {
        this.releaseLayer(live);
        scene.layers.delete(id);
      }
    }
    for (const layer of layers) {
      const live = scene.layers.get(layer.id);
      if (live) {
        live.spec = layer;
        live.gain.gain.setTargetAtTime(perceivedGain(layer.volume), this.ctx.currentTime, 0.05);
      } else {
        this.addLayer(scene, layer, trackUrl);
      }
    }
  }

  /** Livello RMS dell'uscita, 0–1. */
  level(): number {
    const data = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (const sample of data) sum += sample * sample;
    return Math.sqrt(sum / data.length);
  }

  close(): void {
    for (const scene of [this.current, ...this.fading]) if (scene) this.release(scene);
    void this.ctx.close();
  }

  private addLayer(scene: LiveScene, layer: Layer, trackUrl: TrackUrl): void {
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = perceivedGain(layer.volume);
    gainNode.connect(scene.bus);

    let voice: Voice;
    if (layer.kind === 'synth') {
      voice = startSynth(this.ctx, layer.sound, gainNode);
    } else {
      const url = trackUrl(layer.trackId);
      if (!url) return;
      // `<audio>` invece di decodificare in memoria: una traccia di dieci minuti peserebbe centinaia di MB.
      const element = new Audio(url);
      element.loop = true;
      const source = this.ctx.createMediaElementSource(element);
      source.connect(gainNode);
      void element.play().catch(() => undefined);
      voice = {
        stop: () => {
          element.pause();
          element.removeAttribute('src');
          element.load();
          source.disconnect();
        },
      };
    }
    scene.layers.set(layer.id, { spec: layer, gain: gainNode, voice });
  }

  private fadeOutAndRelease(scene: LiveScene, curve: Float32Array, seconds = CROSSFADE_SECONDS): void {
    this.fading.add(scene);
    const now = this.ctx.currentTime;
    scene.bus.gain.cancelScheduledValues(now);
    // La curva parte da 1: se la scena stava ancora entrando, si scala sul valore attuale.
    const from = scene.bus.gain.value;
    scene.bus.gain.setValueCurveAtTime(curve.map((v) => v * from), now, seconds);
    setTimeout(() => {
      this.release(scene);
      this.fading.delete(scene);
    }, seconds * 1000 + 100);
  }

  private release(scene: LiveScene): void {
    for (const live of scene.layers.values()) this.releaseLayer(live);
    scene.layers.clear();
    scene.bus.disconnect();
  }

  private releaseLayer(live: LiveLayer): void {
    live.voice.stop();
    live.gain.disconnect();
  }
}

function sameSource(a: Layer, b: Layer): boolean {
  return a.kind === 'synth' && b.kind === 'synth' ? a.sound === b.sound : a.kind === 'track' && b.kind === 'track' && a.trackId === b.trackId;
}

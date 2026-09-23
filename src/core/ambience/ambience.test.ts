import { describe, it, expect } from 'vitest';
import { seeded } from '../generators/random';
import { BASE_SCENES, SYNTH_SOUNDS, crackleCluster, crossfadeCurves, nextEventDelay, perceivedGain } from './index';

describe('crossfadeCurves — potenza costante', () => {
  const { fadeIn, fadeOut } = crossfadeCurves(64);

  it('comincia e finisce dove deve', () => {
    expect(fadeIn[0]).toBe(0);
    expect(fadeOut[0]).toBe(1);
    expect(fadeIn.at(-1)).toBeCloseTo(1, 12);
    expect(fadeOut.at(-1)).toBeCloseTo(0, 12);
  });

  it('in ogni istante la potenza totale resta 1: nessun buco a metà', () => {
    fadeIn.forEach((value, i) => expect(value ** 2 + fadeOut[i]! ** 2).toBeCloseTo(1, 12));
  });

  it('una curva ha almeno due punti', () => {
    expect(crossfadeCurves(0).fadeIn).toStrictEqual([0, 1]);
  });
});

describe('nextEventDelay', () => {
  it('resta sempre fra minimo e massimo', () => {
    const rng = seeded(7);
    for (let i = 0; i < 2000; i++) {
      const delay = nextEventDelay(rng, 30, 15, 45);
      expect(delay).toBeGreaterThanOrEqual(15);
      expect(delay).toBeLessThanOrEqual(45);
    }
  });

  it('in media sta vicino alla media chiesta, se i limiti sono larghi', () => {
    const rng = seeded(11);
    let sum = 0;
    for (let i = 0; i < 5000; i++) sum += nextEventDelay(rng, 2, 0, 1000);
    expect(sum / 5000).toBeGreaterThan(1.8);
    expect(sum / 5000).toBeLessThan(2.2);
  });

  it('non va all’infinito nemmeno con un generatore che restituisce quasi 1', () => {
    expect(nextEventDelay(() => 0.9999999999, 30, 0, 1e9)).toBeLessThan(1e3);
  });
});

describe('crackleCluster', () => {
  it('da 1 a 5 schiocchi, in ordine, con intensità fra 0,3 e 1', () => {
    const rng = seeded(3);
    for (let i = 0; i < 500; i++) {
      const cluster = crackleCluster(rng);
      expect(cluster.length).toBeGreaterThanOrEqual(1);
      expect(cluster.length).toBeLessThanOrEqual(5);
      expect(cluster[0]?.offset).toBe(0);
      for (let j = 1; j < cluster.length; j++) expect(cluster[j]!.offset).toBeGreaterThan(cluster[j - 1]!.offset);
      for (const pop of cluster) {
        expect(pop.gain).toBeGreaterThanOrEqual(0.3);
        expect(pop.gain).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('perceivedGain', () => {
  it('curva quadratica, limitata fra 0 e 1', () => {
    expect(perceivedGain(0.5)).toBe(0.25);
    expect(perceivedGain(1)).toBe(1);
    expect(perceivedGain(-1)).toBe(0);
    expect(perceivedGain(2)).toBe(1);
  });
});

describe('BASE_SCENES', () => {
  it('ogni suono generato compare in almeno una scena di base', () => {
    const used = new Set(BASE_SCENES.flatMap((scene) => scene.layers.map((layer) => (layer.kind === 'synth' ? layer.sound : null))));
    for (const sound of SYNTH_SOUNDS) expect(used.has(sound)).toBe(true);
  });

  it('nomi diversi, volumi validi, strati con id unici', () => {
    expect(new Set(BASE_SCENES.map((s) => s.name)).size).toBe(BASE_SCENES.length);
    for (const scene of BASE_SCENES) {
      expect(new Set(scene.layers.map((l) => l.id)).size).toBe(scene.layers.length);
      for (const layer of scene.layers) expect(layer.volume).toBeGreaterThan(0);
    }
  });
});

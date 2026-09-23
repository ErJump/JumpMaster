/**
 * I sette suoni generati (SPEC-0016 AC5). Tutto è sintesi: rumore generato una volta, filtri,
 * inviluppi, eventi a tempi casuali. Nessun file, nessuna licenza, nessuna rete.
 *
 * Ogni sintetizzatore riceve il contesto e il nodo su cui suonare, e restituisce una `Voice` da
 * fermare. Il volume dello strato non è affar suo: lo regola il mixer a valle.
 *
 * Solo browser: Web Audio non esiste sul server.
 */
import { crackleCluster, nextEventDelay, type SynthSound } from '@/core/ambience';

export interface Voice {
  stop(): void;
}

type Rng = () => number;

/* ── Materia prima ────────────────────────────────────────────────── */

const noiseCache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/**
 * Otto secondi di rumore, in stereo con i due canali diversi: un rumore ripetuto ogni otto secondi
 * non si riconosce, e due canali indipendenti danno ampiezza invece di un suono «in mezzo alla testa».
 */
function noise(ctx: BaseAudioContext, color: 'white' | 'pink' | 'brown'): AudioBuffer {
  let byColor = noiseCache.get(ctx);
  if (!byColor) noiseCache.set(ctx, (byColor = new Map()));
  const cached = byColor.get(color);
  if (cached) return cached;

  const length = ctx.sampleRate * 8;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    // Rumore rosa: filtro di Paul Kellet. Marrone: rumore bianco integrato, con perdita.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'white') data[i] = white;
      else if (color === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
  }
  byColor.set(color, buffer);
  return buffer;
}

/** Una sorgente di rumore in ciclo, che parte da un punto a caso: due strati non vanno mai in fase. */
function noiseSource(ctx: AudioContext, color: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = noise(ctx, color);
  source.loop = true;
  source.start(0, Math.random() * 8);
  return source;
}

function filter(ctx: AudioContext, type: BiquadFilterType, frequency: number, q = 0.7): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

function gain(ctx: AudioContext, value: number): GainNode {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

/** Oscillatore lento che fa «respirare» un parametro: `centro ± profondità`. */
function lfo(ctx: AudioContext, target: AudioParam, frequency: number, depth: number): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.frequency.value = frequency;
  const amount = gain(ctx, depth);
  osc.connect(amount).connect(target);
  osc.start();
  return osc;
}

/** Riverbero sintetico: una coda di rumore che decade. Basta per una grotta. */
function reverb(ctx: AudioContext, seconds: number): ConvolverNode {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  const node = ctx.createConvolver();
  node.buffer = impulse;
  return node;
}

/**
 * Eventi a tempi casuali (gocce, tuoni, crepitii): ognuno si programma sull'orologio dell'audio,
 * che è preciso; `setTimeout` serve solo a risvegliarsi un po' prima del prossimo.
 */
function every(ctx: AudioContext, nextDelay: () => number, fire: (at: number) => void, firstDelay = nextDelay()): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let at = ctx.currentTime + firstDelay;
  const tick = () => {
    if (stopped) return;
    while (at < ctx.currentTime + 0.3) {
      fire(Math.max(at, ctx.currentTime + 0.01));
      at += nextDelay();
    }
    timer = setTimeout(tick, Math.max(20, (at - ctx.currentTime - 0.2) * 1000));
  };
  tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

/** Un colpo di rumore breve e filtrato, con il suo inviluppo: gocce, crepitii, schiocchi. */
function burst(ctx: AudioContext, out: AudioNode, at: number, options: { color: 'white' | 'pink' | 'brown'; band: number; q: number; peak: number; attack: number; decay: number }) {
  const source = ctx.createBufferSource();
  source.buffer = noise(ctx, options.color);
  const band = filter(ctx, 'bandpass', options.band, options.q);
  const env = gain(ctx, 0);
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(options.peak, at + options.attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + options.attack + options.decay);
  source.connect(band).connect(env).connect(out);
  source.start(at, Math.random() * 7);
  source.stop(at + options.attack + options.decay + 0.05);
}

/* ── I suoni ──────────────────────────────────────────────────────── */

// Livelli tarati misurando l'uscita (RMS a volume pieno): i suoni continui stanno intorno a 0,1,
// quelli a eventi (gocce, tuoni) hanno picchi di 0,2–0,3. Così un cursore al 60% vuol dire la
// stessa cosa per la pioggia e per i grilli.

function rain(ctx: AudioContext, out: AudioNode, rng: Rng): Voice {
  const bed = noiseSource(ctx, 'pink');
  const high = filter(ctx, 'highpass', 500);
  const low = filter(ctx, 'lowpass', 9000);
  const level = gain(ctx, 1.1);
  bed.connect(high).connect(low).connect(level).connect(out);
  const swell = lfo(ctx, level.gain, 0.05, 0.16);
  // Gocce singole sul fondo: sono loro a far sentire «pioggia» invece di «rumore».
  const stopDrops = every(ctx, () => nextEventDelay(rng, 0.06, 0.01, 0.25), (at) =>
    burst(ctx, out, at, { color: 'white', band: 2500 + rng() * 4500, q: 3, peak: 0.13 + rng() * 0.2, attack: 0.002, decay: 0.03 + rng() * 0.04 }),
  );
  return { stop: () => (stopDrops(), bed.stop(), swell.stop()) };
}

function wind(ctx: AudioContext, out: AudioNode): Voice {
  const source = noiseSource(ctx, 'brown');
  const low = filter(ctx, 'lowpass', 500, 1.5);
  const level = gain(ctx, 0.7);
  source.connect(low).connect(level).connect(out);
  // Quattro oscillatori lenti, a frequenze che non si ripetono insieme: raffiche irregolari.
  const oscs = [lfo(ctx, low.frequency, 0.07, 280), lfo(ctx, low.frequency, 0.023, 150), lfo(ctx, level.gain, 0.11, 0.25), lfo(ctx, level.gain, 0.037, 0.2)];
  return { stop: () => (source.stop(), oscs.forEach((o) => o.stop())) };
}

function fire(ctx: AudioContext, out: AudioNode, rng: Rng): Voice {
  const rumble = noiseSource(ctx, 'brown');
  const low = filter(ctx, 'lowpass', 280);
  const level = gain(ctx, 0.75);
  rumble.connect(low).connect(level).connect(out);
  const flicker = lfo(ctx, level.gain, 0.3, 0.12);
  const stopCrackles = every(ctx, () => nextEventDelay(rng, 0.3, 0.04, 1.8), (at) => {
    for (const pop of crackleCluster(rng)) {
      burst(ctx, out, at + pop.offset, { color: 'white', band: 1800 + rng() * 3500, q: 1.2, peak: 0.5 * pop.gain, attack: 0.001, decay: 0.004 + rng() * 0.012 });
    }
  });
  return { stop: () => (stopCrackles(), rumble.stop(), flicker.stop()) };
}

function drips(ctx: AudioContext, out: AudioNode, rng: Rng): Voice {
  const room = noiseSource(ctx, 'brown');
  const roomLow = filter(ctx, 'lowpass', 120);
  const roomLevel = gain(ctx, 0.12);
  room.connect(roomLow).connect(roomLevel).connect(out);
  const hall = reverb(ctx, 2.8);
  const wet = gain(ctx, 0.5);
  hall.connect(wet).connect(out);
  const stopDrips = every(ctx, () => nextEventDelay(rng, 2.2, 0.5, 7), (at) => {
    const osc = ctx.createOscillator();
    const start = 1100 + rng() * 1300;
    osc.frequency.setValueAtTime(start, at);
    osc.frequency.exponentialRampToValueAtTime(start * 0.55, at + 0.07);
    const env = gain(ctx, 0);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.25 + rng() * 0.2, at + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    osc.connect(env);
    env.connect(out);
    env.connect(hall);
    osc.start(at);
    osc.stop(at + 0.2);
  });
  return { stop: () => (stopDrips(), room.stop()) };
}

function thunder(ctx: AudioContext, out: AudioNode, rng: Rng): Voice {
  const stopThunder = every(ctx, () => nextEventDelay(rng, 28, 12, 60), (at) => {
    const source = ctx.createBufferSource();
    source.buffer = noise(ctx, 'brown');
    const low = filter(ctx, 'lowpass', 220);
    const env = gain(ctx, 0);
    const attack = 0.3 + rng() * 1;
    const length = 3.5 + rng() * 4;
    low.frequency.setValueAtTime(260, at);
    low.frequency.exponentialRampToValueAtTime(70, at + length);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(1.8, at + attack);
    // Il tuono rimbomba: qualche ripresa a caso lungo la coda.
    let t = at + attack;
    for (let i = 0; i < 3; i++) {
      t += 0.4 + rng() * 0.8;
      env.gain.linearRampToValueAtTime(0.7 + rng() * 1, t);
    }
    env.gain.exponentialRampToValueAtTime(0.0001, at + length);
    source.connect(low).connect(env).connect(out);
    source.start(at, Math.random() * 3);
    source.stop(at + length + 0.1);
    // Il primo tuono arriva presto: chi avvia «Tempesta» deve sentirlo, non aspettare un minuto.
  }, 3 + rng() * 5);
  return { stop: stopThunder };
}

function waves(ctx: AudioContext, out: AudioNode, rng: Rng): Voice {
  const sea = noiseSource(ctx, 'pink');
  const band = filter(ctx, 'lowpass', 600, 0.5);
  const level = gain(ctx, 0.35);
  sea.connect(band).connect(level).connect(out);
  // Ogni onda sale, si rompe, si ritira: durata diversa ogni volta.
  const stopWaves = every(ctx, () => 6 + rng() * 5, (at) => {
    const rise = 2 + rng() * 1.5;
    const peak = 1.3 + rng() * 0.9;
    level.gain.setTargetAtTime(peak, at, rise / 3);
    band.frequency.setTargetAtTime(1600 + rng() * 800, at, rise / 3);
    level.gain.setTargetAtTime(0.3, at + rise, 1.4);
    band.frequency.setTargetAtTime(500, at + rise, 1.4);
  });
  return { stop: () => (stopWaves(), sea.stop()) };
}

function crickets(ctx: AudioContext, out: AudioNode, rng: Rng): Voice {
  // Tre grilli a distanze diverse: altezze, volumi e ritmi propri.
  const insects = [0, 1, 2].map(() => ({ pitch: 4200 + rng() * 800, level: 0.15 + rng() * 0.2, pan: rng() * 1.6 - 0.8 }));
  const stops = insects.map((insect) => {
    const panner = ctx.createStereoPanner();
    panner.pan.value = insect.pan;
    panner.connect(out);
    return every(ctx, () => nextEventDelay(rng, 1.1, 0.35, 3), (at) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = insect.pitch;
      const env = gain(ctx, 0);
      const pulses = 3 + Math.floor(rng() * 3);
      for (let i = 0; i < pulses; i++) {
        const t = at + i * 0.034;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(insect.level, t + 0.004);
        env.gain.linearRampToValueAtTime(0, t + 0.018);
      }
      osc.connect(env).connect(panner);
      osc.start(at);
      osc.stop(at + pulses * 0.034 + 0.02);
    });
  });
  return { stop: () => stops.forEach((stop) => stop()) };
}

const SYNTHS: Record<SynthSound, (ctx: AudioContext, out: AudioNode, rng: Rng) => Voice> = {
  rain,
  wind: (ctx, out) => wind(ctx, out),
  fire,
  drips,
  thunder,
  waves,
  crickets,
};

export function startSynth(ctx: AudioContext, sound: SynthSound, out: AudioNode, rng: Rng = Math.random): Voice {
  return SYNTHS[sound](ctx, out, rng);
}

/**
 * Dissolvenze e tempi degli eventi casuali. Pura matematica: il motore la traduce in rampe Web Audio.
 */
import type { Rng } from '../generators/random';

/**
 * Curve a **potenza costante**: in ogni istante `in² + out² = 1`. Con una dissolvenza lineare la
 * potenza a metà scende a 0,5 e si sente un «buco» fra le due scene; così no.
 */
export function crossfadeCurves(steps: number): { fadeIn: number[]; fadeOut: number[] } {
  const n = Math.max(2, Math.floor(steps));
  const fadeIn: number[] = [];
  const fadeOut: number[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / (n - 1)) * (Math.PI / 2);
    fadeIn.push(Math.sin(angle));
    fadeOut.push(Math.cos(angle));
  }
  return { fadeIn, fadeOut };
}

/**
 * Attesa fino al prossimo evento (un tuono, una goccia, un crepitio): esponenziale, come gli
 * eventi indipendenti in natura, ma limitata fra `min` e `max`. Senza limiti due tuoni potrebbero
 * arrivare a un secondo di distanza, o non arrivare per dieci minuti.
 */
export function nextEventDelay(rng: Rng, mean: number, min: number, max: number): number {
  const u = Math.min(rng(), 0.999999);
  const exponential = -Math.log(1 - u) * mean;
  return Math.min(max, Math.max(min, exponential));
}

/**
 * Un crepitio del fuoco non è mai uno solo: un grappolo di 1–5 schiocchi ravvicinati, di intensità
 * diversa. Restituisce ritardi (s) e intensità (0–1) di ogni schiocco.
 */
export function crackleCluster(rng: Rng): Array<{ offset: number; gain: number }> {
  const count = 1 + Math.floor(rng() * 5);
  const out: Array<{ offset: number; gain: number }> = [];
  let offset = 0;
  for (let i = 0; i < count; i++) {
    out.push({ offset, gain: 0.3 + rng() * 0.7 });
    offset += 0.01 + rng() * 0.08;
  }
  return out;
}

/** Il volume di uno strato come lo sente l'orecchio: il cursore va in modo lineare, il guadagno no. */
export function perceivedGain(volume: number): number {
  const v = Math.min(1, Math.max(0, volume));
  return v * v;
}

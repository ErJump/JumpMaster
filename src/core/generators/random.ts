/**
 * Casualità per i generatori. ⚠ Modulo puro (invariante I1).
 *
 * Il generatore è **iniettabile**, come per i dadi: nei test si usa `seeded(n)` e ogni risultato
 * diventa ripetibile, quindi verificabile con un'asserzione invece che a occhio.
 */
export type Rng = () => number;

/** Generatore deterministico (mulberry32): stesso seme, stessa sequenza. Solo per i test. */
export function seeded(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function between(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick: elenco vuoto');
  return items[Math.floor(rng() * items.length)]!;
}

/** `count` elementi diversi fra loro (o tutti, se sono meno). */
export function pickMany<T>(rng: Rng, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  while (result.length < count && pool.length > 0) {
    result.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
  }
  return result;
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

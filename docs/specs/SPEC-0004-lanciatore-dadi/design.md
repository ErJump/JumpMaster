# SPEC-0004 — Design

## Moduli

```
src/core/dice/
  parse.ts     · notazione → AST, con errori in italiano
  roll.ts      · AST + RNG → risultato dettagliato
  format.ts    · risultato → testo leggibile
  types.ts
  *.test.ts
```

`core/dice` è **puro**: nessun React, nessun DB (invariante I1).

## RNG iniettabile

```ts
export type Rng = () => number;                    // [0, 1)
export function roll(ast: DiceExpr, rng: Rng = Math.random): RollResult
```

Nei test si passa un generatore deterministico. Senza questo, testare "4d6kh3 scarta il più basso"
sarebbe impossibile senza statistica — e AC11 sarebbe irrealizzabile.

## Risultato dettagliato, non solo il totale

```ts
type RollResult = {
  total: number;
  terms: Array<{
    notation: string;
    dice: Array<{ value: number; kept: boolean; faces: number }>;  // kept:false → barrato (AC3)
    modifier?: number;
    subtotal: number;
  }>;
  natural20: boolean;   // AC4
  natural1: boolean;
};
```

Mostrare i singoli dadi non è un vezzo: è ciò che rende il lancio verificabile e quindi credibile
davanti al tavolo.

## Perché un parser scritto a mano

La grammatica è minuscola e chiusa. Un parser ricorsivo-discendente di ~150 righe la copre tutta,
resta leggibile e permette messaggi d'errore in italiano scritti su misura. Aggiungere una libreria
di parsing significherebbe una dipendenza (e un ADR) per risolvere un problema che non lo richiede.

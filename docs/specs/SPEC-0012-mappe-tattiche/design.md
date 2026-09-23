# SPEC-0012 — Design

## Schema

```ts
maps = {
  id, campaignId → CASCADE, name, kind: 'battle' | 'world',
  imageFile, imageWidth, imageHeight,           // dimensioni lette dai byte (AC3)
  gridSize, gridOffsetX, gridOffsetY, showGrid, // in pixel dell'immagine
  fog: json  string[]  — caselle RIVELATE, "col,row"
  tokens: json Token[] — { id, label, color, col, row, size, combatantId?, hidden }
  pins: json Pin[]     — SPEC-0013
}
liveState.mapId  (+ modalità 'map')
```

La nebbia salva le caselle **rivelate**: una mappa nuova è tutta coperta, come deve essere.

## Core puro — `src/core/maps/`

```ts
gridDimensions(map)             → { cols, rows }
cellAt(point, grid)             → { col, row }
distanceFeet(a, b)              → 5 × max(|Δcol|, |Δrow|)       // SRD: diagonali a 5 ft
revealRect / coverRect(fog, a, b) → fog
toPublicMap(map, combat?)       → PublicMap
```

`toPublicMap` include solo i segnalini **visibili**: non nascosti, non legati a un combattente
nascosto, e con almeno una casella rivelata. Come `PublicCombatant`, è un **tipo diverso**: niente
`hidden`, niente `combatantId` (ADR-0009, ADR-0012).

## Immagini

Il salvataggio delle immagini, finora nella slice `player`, sale nel livello di archiviazione
condiviso `src/db/files.ts`: ora lo usano due slice (invariante I2). Le dimensioni si leggono
dall'intestazione del file (`lib/image-type.ts`: PNG, GIF, JPEG, WebP), con test.

## Editor (DM)

SVG sopra l'immagine, `viewBox` = dimensioni dell'immagine: griglia, nebbia, segnalini e righello
vivono nello stesso sistema di coordinate dell'immagine. Il puntatore si converte con
`getScreenCTM().inverse()`.

Modalità: **Muovi** · **Rivela** · **Copri** · **Misura**. Salvataggio automatico con ritardo breve
(250 ms): la Vista deve seguire i movimenti quasi in tempo reale.

## Vista Giocatori

Nuova modalità `map` in `live_state`. `buildPlayerView` la costruisce con `toPublicMap` e, se c'è
un combattimento in corso, aggiunge il nome di chi è di turno (se non è nascosto).

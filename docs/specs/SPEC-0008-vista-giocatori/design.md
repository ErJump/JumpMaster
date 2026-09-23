# SPEC-0008 — Design

## Schema

```ts
liveState = {                       // una riga per campagna (invariante I6)
  campaignId PK → ON DELETE CASCADE,
  mode: 'auto' | 'handout' | 'blackout',
  handoutId → handouts.id ON DELETE SET NULL,
  lastRoll: json | null,            // { text, at } — tiro pubblico dalla pagina dei dadi
  updatedAt
}

handouts = {
  id, campaignId → ON DELETE CASCADE,
  title, body,
  imageFile,                        // nome generato: <uuid>.<ext>, in data/uploads/
  createdAt, updatedAt
}
```

## La vista pubblica è una funzione pura

```
src/core/events/public-view.ts
  hpBand(current, max, status) → 'illeso' | 'ferito' | 'malconcio' | 'in-fin-di-vita' | 'morto'
  toPublicCombat(state: CombatState) → PublicCombat
```

`PublicCombatant` **non ha** i campi `maxHp`, `currentHp`, `ac`, `srdMonsterSlug` per i mostri: non
è un filtro applicato dopo, è un **tipo diverso**. Un campo riservato non può finire nella
finestra dei giocatori per distrazione, perché non esiste nel tipo che ci arriva.

I test verificano sulla **stringa JSON serializzata** che non compaiano i numeri dei mostri:
è ciò che viaggia davvero verso il browser (AC7, AC11).

### Fasce dei punti ferita

| Fascia | PF correnti |
|---|---|
| Illeso | 100% |
| Ferito | oltre il 50% |
| Malconcio | oltre il 25% |
| In fin di vita | sopra 0 |
| Morto | 0, o morto |

### Combattenti nascosti

Nuovo evento `visibility-set { id, hidden }` nel riduttore; `Combatant.hidden` (default `false`).
La vista pubblica li esclude. Se è il turno di un nascosto, `currentId` è `null`: nessuna riga
evidenziata, niente nome — la Vista non tradisce che c'è qualcuno (AC10).

## Flusso

```
DM agisce → Server Action scrive nel DB
                                   ↓
/api/live (SSE) ogni 500 ms → buildPlayerView() → diversa dall'ultima? → invia
                                   ↓
/player  EventSource → rende
```

`buildPlayerView()` sta nella slice `player` e legge le tabelle, non il codice di altre slice
(invariante I2). La modalità **automatica** fa sì che il combattimento non debba sapere
nulla della Vista: la Vista guarda se c'è uno scontro `running` nella campagna.

## Immagini

- Caricate con una Server Action; `bodySizeLimit` alzato a 10 MB in `next.config.ts`.
- Tipo verificato sui **byte iniziali** (magic number), non sull'estensione dichiarata.
- Salvate in `data/uploads/<uuid>.<ext>` — `data/` è già fuori da git.
- Servite da `/api/uploads/[file]`, che accetta **solo** nomi nel formato `<uuid>.<ext>`:
  nessun percorso arbitrario può essere letto dal disco.

## Tiri pubblici

La pagina dei dadi riceve dal livello `app/` una Server Action `onPublicRoll` come prop: la slice
`dice` non importa `player` (invariante I2).

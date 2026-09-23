# SPEC-0013 — Design

Stessa tabella `maps` con `kind: 'world'`; i segnaposto in `pins`:

```ts
Pin = { id, x, y, label, known }   // x, y: frazioni 0–1 dell'immagine
```

Frazioni e non pixel: se il DM sostituisce l'immagine con una versione a risoluzione diversa, i
segnaposto restano al loro posto.

Il collegamento usa `resolveLinkIn` (SPEC-0009) sul nome del segnaposto. Le citazioni (AC6) si
calcolano in `db/queries/links.ts` accanto a quelle di note e sessioni.

`toPublicMap` per una mappa del mondo include solo i segnaposto `known`.

# SPEC-0009 — Design

## Schema

```ts
notes = { id, campaignId → CASCADE, title, kind, body, createdAt, updatedAt }
```

I collegamenti **non si salvano**: si ricavano dal testo. Su qualche centinaio di note la
scansione è istantanea, e non c'è una seconda fonte di verità da tenere allineata (lo stesso
principio dei valori derivati dei personaggi).

## Collegamenti — `src/lib/wikilinks.ts` (puro, testato)

```ts
extractLinks(body)              → string[]   // i titoli citati, normalizzati e senza doppioni
renameLinks(body, from, to)     → string     // riscrive [[from]] e [[from|testo]] in [[to]]
linkKey(title)                  → string     // minuscole, senza accenti, spazi compressi
```

Sintassi: `[[Titolo]]` e `[[Titolo|testo mostrato]]`.

## Rendering

`parseInline` di `src/lib/markdown.ts` impara un nuovo nodo `wikilink`. Il componente `Markdown`
riceve un `resolveLink(title) → { href, missing }` opzionale: senza, i collegamenti restano
testo. Così il parser resta puro e il componente resta ignaro di note e personaggi.

## Risoluzione (livello `app/`)

Nota con quel titolo → personaggio con quel nome → mancante (`/note/nuova?titolo=…`).
I nomi dei personaggi si leggono con una query condivisa in `src/db/queries/` (invariante I7).

## Rinomina (AC6)

Quando cambia il titolo di una nota, in una transazione si riscrivono i `[[vecchio]]` in tutte
le note della campagna. Il DM non deve inseguire i collegamenti a mano.

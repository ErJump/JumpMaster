# SPEC-0010 — Design

## Schema

```ts
sessions = {
  id, campaignId → CASCADE,
  number, title, playedOn (AAAA-MM-GG, facoltativa),
  prep: json,     // { characters, strongStart, scenes[], secrets[{text, revealed}], locations[], npcs[], monsters[], rewards[] }
  journal: text,  // markdown
  createdAt, updatedAt
}
```

`prep` è JSON validato con Zod al confine: gli otto passi sono una struttura fissa e piccola, e
normalizzarla in otto tabelle non porterebbe nulla se non query più lunghe.

## Segreti che passano alla sessione successiva (AC4)

`carryOverSecrets(previousPrep) → Secret[]` in `src/core/sessions/` — pura, testata: prende i
segreti non rivelati, li rimette a `revealed: false`, toglie i doppioni.

## Bozza dal registro (AC7)

`summarizeCombat(state) → string[]` in `src/core/events/` — pura, testata. Legge lo stato finale
di un combattimento e produce frasi in italiano: round giocati, nemici sconfitti, PG caduti a terra
o morti. È la promessa fatta in ADR-0005: il registro diventa il riassunto della sessione.

Quali combattimenti: quelli conclusi (`done`) con `updatedAt` successivo alla creazione della
sessione precedente. La lettura del registro passa da `src/db/queries/combat-log.ts` (I7).

## Salvataggio

Automatico, con un breve ritardo dopo l'ultima modifica (ogni tasto premuto non deve diventare
una scrittura). Stesso principio del costruttore di scontri: nessun pulsante «Salva» da dimenticare.

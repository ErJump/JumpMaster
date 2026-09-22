# ADR-0005 — Combat tracker event-sourced

- **Stato:** accepted
- **Data:** 2026-09-22

## Contesto

Il combat tracker è la feature più importante dell'app (`docs/memory/product-context.md`). Durante il
combattimento il DM inserisce decine di modifiche al minuto — danni, cure, condizioni, cambi di turno —
**in diretta, davanti a quattro persone, andando di fretta**. Sbaglierà: digiterà 18 invece di 8,
applicherà il danno alla creatura sbagliata, passerà il turno troppo presto.

## Decisione

Il combattimento non memorizza uno stato mutabile, ma un **log di eventi append-only** in
`src/core/events/`. Lo stato corrente è la **riduzione** degli eventi.

```
evento: { id, encounterId, ts, type: 'damage' | 'heal' | 'condition' | 'turn' | …, payload }
stato  = eventi.reduce(applica, statoIniziale)
```

## Conseguenze

**Guadagniamo**
- **Undo gratuito**: annullare = ignorare l'ultimo evento. Requisito di prodotto n.2
  ("tutto è annullabile"), non un lusso.
- Cronologia leggibile del combattimento → **recap automatico della sessione** in M4, senza lavoro extra.
- Replay e debug: se lo stato sembra sbagliato, si legge la sequenza che l'ha prodotto.
- Si sposa naturalmente con la Vista Giocatori (M3): gli eventi sono già il flusso da trasmettere via SSE.

**Paghiamo**
- Più complesso di un semplice `UPDATE hp SET …`.
- Serve uno snapshot periodico se un combattimento diventa lunghissimo (non un problema reale:
  parliamo di centinaia di eventi, non milioni).
- Il reducer deve essere puro e testato: sta in `core/`, quindi è già la regola.

## Alternative scartate

- **Stato mutabile + tabella di undo separata** — due fonti di verità da tenere allineate, con il
  rischio classico che divergano proprio quando serve l'undo.
- **Nessun undo** — inaccettabile: contraddice un principio di prodotto ed è esattamente il tipo di
  attrito che mette in difficoltà un DM alle prime armi.

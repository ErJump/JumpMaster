# SPEC-0011 — Design

```
src/core/generators/
  random.ts      · Rng, pick, pickMany, chance, seeded(seed) — generatore deterministico per i test
  tables.ts      · tutte le tabelle di testo, originali (ADR-0011)
  names.ts       · nomi per sillabe, per ascendenza
  npc.ts · tavern.ts · shop.ts · rumor.ts · hook.ts
  encounter.ts   · incontro in una fascia: prova combinazioni e tiene quella giusta
  treasure.ts    · monete + oggetti magici per livello
```

Tutto puro: niente database. I dati SRD (mostri, oggetti) arrivano **come argomenti** dal livello
`app/`, che li legge dal database.

## Incontro nella fascia (AC5)

Si provano fino a 200 combinazioni casuali (un tipo di mostro o due, quantità 1–8) fra i mostri di
grado di sfida vicino al livello, e si tiene la prima la cui stima (`evaluateEncounter`, ADR-0008)
cade nella fascia richiesta. Se nessuna ci cade, si restituisce la più vicina e lo si dice.

## Tesoro (AC6)

- Monete: `livello × 10 × 1d6` mo, con qualche moneta d'argento e rame per sapore.
- Oggetti: probabilità e rarità crescenti col livello (comune/non comune ai primi livelli, raro
  dal 5°, molto raro dall'11°, leggendario dal 17°).
- Formula dichiarata come stima dell'app, come la difficoltà.

## Salvataggi (AC3–AC5)

Il componente dei generatori riceve dal livello `app/` tre Server Action come prop:
`saveAsNpc`, `saveAsNote`, `saveAsEncounter`. La slice `generators` non importa `characters`,
`notes` né `encounters` (invariante I2).

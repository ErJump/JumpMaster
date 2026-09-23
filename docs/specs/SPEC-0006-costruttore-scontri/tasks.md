# SPEC-0006 — Tasks

- [x] `core/rules/encounter.ts`: `actionEconomyFactor`, `partyBenchmarkXp`, `evaluateEncounter`
- [x] Test: scontro singolo, sciame, gruppo assente, livelli agli estremi — 19 test
- [x] Schema Drizzle `encounters` + `encounter_monsters` + migrazione
- [x] `queries.ts`, `actions.ts`, `schema.ts` Zod — il client manda solo `{slug, count}`, il resto lo rilegge il server
- [x] Ricerca sui 334 mostri con GS e PE visibili (dentro `EncounterBuilder`)
- [x] `DifficultyMeter`: fascia + **tutti i passaggi del calcolo**
- [x] Avviso esplicito «stima dell'app, non regola ufficiale» (AC4)
- [x] Elenco scontri della campagna, con la fascia per ciascuno
- [ ] Pulsante «Avvia il combattimento» → SPEC-0007
- [ ] AC1–AC11 provati a mano

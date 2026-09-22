# SPEC-0003 — Tasks

## Importer
- [x] `datasets.ts` con i conteggi attesi
- [x] `fetch.ts`
- [x] `normalize.ts` + test (GS frazionari, CA e PF da forme diverse) — 19 test
- [x] `import.ts` con transazione, idempotenza e stampa dei conteggi
- [x] Schema Drizzle `srd_*` + indici

## core/rules
- [x] `abilityModifier`, `formatModifier`
- [x] `proficiencyBonus` (per livello e per GS)
- [x] `crLabel` (⅛ ¼ ½), `crFromLabel`, `crToXp`
- [x] `passiveScore`, `averageRoll`
- [x] Test con casi limite — 24 test

## Slice
- [x] `bestiary` + `StatBlock` in stile Monster Manual
- [x] `spells`
- [x] `items` (magici + equipaggiamento in un solo elenco)
- [x] `rules` (sezioni + condizioni) con renderer markdown scritto a mano
- [x] `glossary` (85 termini) + **ricerca bilingue** in tutto il compendio

## Verifiche
- [x] Conteggi confermati nel database (1729 voci, idempotenza verificata con doppio import)
- [ ] **Prova offline reale** (Wi-Fi staccato) — da fare
- [x] Attribuzione SRD visibile in home e su ogni scheda

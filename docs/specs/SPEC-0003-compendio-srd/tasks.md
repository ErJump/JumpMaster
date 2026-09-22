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
- [ ] `bestiary` + `StatBlock` in stile Monster Manual
- [ ] `spells`
- [ ] `items`
- [ ] `rules` (sezioni + condizioni)
- [ ] `glossary`

## Verifiche
- [x] Conteggi confermati nel database (1729 voci, idempotenza verificata con doppio import)
- [ ] **Prova offline reale** (Wi-Fi staccato)
- [ ] Attribuzione SRD visibile

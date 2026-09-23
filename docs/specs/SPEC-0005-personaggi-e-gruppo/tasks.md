# SPEC-0005 — Tasks

## core/rules
- [x] `character.ts`: `SKILLS`, `abilityModifiers`, `savingThrow`, `passiveSkill`, `initiativeModifier`
- [x] Test con casi limite (esperienza, livelli di scatto della competenza, punteggi bassi) — 13 test

## Dati
- [x] Schema Drizzle `characters` + migrazione `0001_m2-tavolo`
- [x] `schema.ts` Zod con messaggi in italiano
- [x] `derive.ts` (verificato nel browser contro valori calcolati a mano)
- [x] `queries.ts`, `actions.ts` — le query ricevono `campaignId` (invariante I2)

## Interfaccia
- [x] `CharacterForm` per PG, con i modificatori aggiornati mentre si digita
- [x] `CharacterForm` per PNG
- [x] Elenco personaggi diviso fra PG e PNG
- [x] **Party Dashboard** `/gruppo`: colpo d'occhio + tiri salvezza + passive
- [x] Segreto del PNG marcato come riservato
- [x] Guardia «serve una campagna attiva» (`CampaignRequired`)

## Verifiche
- [ ] AC1–AC14 provati a mano nel browser

# SPEC-0005 — Tasks

## core/rules
- [ ] `character.ts`: `SKILLS`, `abilityModifiers`, `savingThrow`, `passiveSkill`, `initiativeModifier`
- [ ] Test con casi limite (esperienza, livelli di scatto della competenza, punteggi bassi)

## Dati
- [ ] Schema Drizzle `characters` + migrazione
- [ ] `schema.ts` Zod con messaggi in italiano
- [ ] `derive.ts` + test
- [ ] `queries.ts`, `actions.ts`

## Interfaccia
- [ ] `CharacterForm` per PG (sei punteggi, competenze, esperienza)
- [ ] `CharacterForm` per PNG (campi narrativi, collegamento allo stat block)
- [ ] Elenco personaggi diviso fra PG e PNG
- [ ] **Party Dashboard** `/gruppo`: colpo d'occhio + tabella dei tiri salvezza
- [ ] Segreto del PNG marcato come riservato
- [ ] Guardia «serve una campagna attiva»

## Verifiche
- [ ] AC1–AC14 provati a mano nel browser

# SPEC-0006 — Design

## Schema

```ts
encounters = {
  id, campaignId → ON DELETE CASCADE,
  name, description, notes,
  status: 'planned' | 'running' | 'done',
  createdAt, updatedAt
}

encounterMonsters = {
  id, encounterId → ON DELETE CASCADE,
  srdMonsterSlug,          // riferimento a srd_monsters.slug
  count,
  // copie del momento dell'aggiunta: se un giorno reimportiamo l'SRD e un mostro
  // cambia, lo scontro salvato resta quello che il DM aveva preparato
  name, cr, xp
}
```

## Il calcolo, in `core/rules/encounter.ts`

Modulo **puro** (invariante I1), testato. Contiene le uniche soglie del sistema: se la taratura si
rivelerà sbagliata al tavolo, si cambia **qui** e basta.

```ts
type Difficulty = 'banale' | 'facile' | 'impegnativo' | 'duro' | 'letale';

actionEconomyFactor(monsterCount: number): number
partyBenchmarkXp(partyLevel: number, partySize: number): number
evaluateEncounter(monsters, party): EncounterEvaluation
```

`EncounterEvaluation` porta con sé **tutti i passaggi**, non solo il verdetto: PE totali, fattore
applicato, riferimento, rapporto, fascia. L'interfaccia li mostra tutti (AC2). Un DM che non capisce
da dove esce un numero non impara a fidarsene, e l'app esiste anche per insegnargli il mestiere.

`partyBenchmarkXp` usa `crToXp`, già in `core/rules/challenge.ts`: il riferimento è **i PE di un
mostro di GS pari al livello del gruppo**, scalati sulla dimensione reale del gruppo. Per livelli
oltre il 20 o gradi non in tabella si prende il valore più vicino disponibile.

## Moduli

```
src/features/encounters/
  feature.config.ts · schema.ts · queries.ts · actions.ts
  components/  EncounterBuilder (client) · MonsterPicker · DifficultyMeter · EncounterList
```

**Calcolo lato client** per l'aggiornamento istantaneo (AC3): `evaluateEncounter` è puro e
leggerissimo, quindi gira nel browser mentre il DM aggiunge mostri, senza viaggi al server.
Il salvataggio resta una Server Action.

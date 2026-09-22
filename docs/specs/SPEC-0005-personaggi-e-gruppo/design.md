# SPEC-0005 — Design

## Schema

```ts
characters = {
  id, campaignId → campaigns.id ON DELETE CASCADE,   // invariante I6
  kind: 'pc' | 'npc',
  name,
  // PG
  playerName, className, subclass, race, level,
  ac, maxHp, speed,
  str, dex, con, int, wis, cha,
  saveProficiencies:  json,   // ['dex', 'wis']
  skillProficiencies: json,   // ['perception', 'stealth']
  skillExpertise:     json,   // ['perception']
  // PNG
  role, location, disposition, appearance, voice, secret, srdMonsterSlug,
  notes, archived,
  createdAt, updatedAt
}
```

Una sola tabella per due tipi: i campi non condivisi restano nulli. L'alternativa — due tabelle —
raddoppierebbe query, form e rotte per due entità che il DM pensa come «le persone della mia
campagna», e che il combat tracker (SPEC-0007) tratterà allo stesso modo.

## Nessun valore derivato viene salvato

Percezione passiva, tiri salvezza e modificatore di iniziativa **non stanno nel database**: si
calcolano da `src/core/rules/`. Salvarli significherebbe due fonti di verità che prima o poi
divergono — tipicamente dopo un passaggio di livello, quando il bonus di competenza cambia e
qualcuno dimentica di ricalcolare.

Serve estendere `core/rules` con:

```ts
// src/core/rules/character.ts
abilityModifiers(scores)                       → Record<Ability, number>
savingThrow(scores, ability, proficient, pb)   → number
passiveSkill(scores, skill, proficiency, pb)   → number   // 'none' | 'proficient' | 'expertise'
initiativeModifier(scores)                     → number
SKILLS                                          // abilità → caratteristica associata
```

`SKILLS` mappa ogni abilità alla sua caratteristica (Percezione → Saggezza, Indagare → Intelligenza,
Intuizione → Saggezza…). È dato SRD, già nel glossario per i nomi italiani.

## Moduli

```
src/features/characters/
  feature.config.ts
  schema.ts       · Zod, messaggi in italiano
  queries.ts      · listCharacters, getCharacter, listParty, partyAverageLevel
  actions.ts      · create, update, delete
  derive.ts       · da riga del database a scheda calcolata (usa core/rules)
  components/     · CharacterForm, PcCard, NpcCard, PartyDashboard, AbilityScoreInput
```

`derive.ts` è il ponte fra la riga grezza e ciò che si mostra: prende un `Character` e restituisce
un `DerivedCharacter` con modificatori, passive e tiri salvezza già calcolati. Pure, testabile.

## Party Dashboard

Rotta `/gruppo`. Due tabelle:

1. **Colpo d'occhio** — nome, classe e livello, CA, PF, Percezione passiva, iniziativa.
   La Percezione passiva più alta del gruppo è evidenziata: è il numero che il DM confronta
   con la CD di un nascondiglio, e cercarlo ogni volta fra sei righe fa perdere tempo.
2. **Tiri salvezza** — una riga per personaggio, una colonna per caratteristica. Serve a risolvere
   un *fireball* su tutto il gruppo senza chiedere niente a nessuno.

Tipografia maggiorata rispetto al resto dell'app: questa è la pagina che il DM guarda **da lontano**
mentre parla, non quella che legge da vicino.

# SPEC-0015 — Design

Vedi ADR-0013 per le scelte su licenze, tabelle e formato.

## Schema

```ts
open5e_licenses  = { key PK, name, text }
open5e_documents = { key PK, name, publisher, permalink, licenses: json string[], monsterCount, importedAt }
open5e_monsters  = { ...stesse colonne di srd_monsters, documentKey → open5e_documents CASCADE }

VIEW monsters = SELECT …, 'srd' AS source FROM srd_monsters
      UNION ALL SELECT …, document_key AS source FROM open5e_monsters
```

## Moduli

```
src/content/open5e/
  api.ts         Zod della risposta Open5e (input esterno) + download con `fetch` iniettato
  normalize.ts   creatura Open5e → SrdMonsterData, puro, testato
src/db/queries/monsters.ts   letture condivise sulla vista (I7): bestiario, scontri, combattimento
src/features/sources/        slice «Fonti aperte»
  catalog.ts     manuali disponibili (rete) + scaricati (database)
  install.ts     scarica, converte, sostituisce in una transazione
src/app/api/fonti/[key]/route.ts   POST → avanzamento in NDJSON
```

## Download

1. Metadati del manuale e delle sue licenze.
2. Creature a pagine da 100, seguendo `next`; ogni pagina validata con Zod. Una riga di
   avanzamento NDJSON per pagina.
3. Conversione di tutte le creature **prima** di toccare il database.
4. Una transazione: cancella il manuale (a cascata i suoi mostri), reinserisce tutto (AC7, AC8).

Se la rete cade al punto 2, il database non è stato toccato.

## Conversione (punti non ovvi)

| Open5e | SRD |
|---|---|
| `challenge_rating` 0.125 | `challenge_rating` 0.125, etichetta ⅛ da `core/rules` |
| `saving_throws` `{constitution: 6}` | `proficiencies` `saving-throw-con`, «Saving Throw: CON» |
| `skill_bonuses` `{sleight_of_hand: 5}` | `skill-sleight-of-hand`, «Skill: Sleight of Hand» |
| `attacks[0]` dadi, bonus, extra | `attack_bonus`, `damage[]` con `damage_dice` «1d8+4», «6d6» |
| `usage_limits` PER_DAY 3 | nome «Enslave (3/Day)» |
| `usage_limits` RECHARGE_ON_ROLL 5 | nome «Fire Breath (Recharge 5–6)» |
| `action_type` BONUS_ACTION | fra le azioni, nome «… (Bonus Action)» |
| `legendary_action_cost` 2 | nome «… (Costs 2 Actions)» |
| `*_range` dei sensi | `senses` «120 ft.» |

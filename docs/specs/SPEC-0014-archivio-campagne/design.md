# SPEC-0014 — Design

## Il file

JSON, un solo file, **nessuna dipendenza nuova**: niente zip. Le immagini viaggiano in base64
dentro il JSON. Un file con qualche mappa pesa decine di MB: accettabile per un backup, e il JSON
resta leggibile e riparabile a mano in caso di bisogno.

```ts
{
  format: 'jumpmaster.campaign',
  version: 1,
  exportedAt: ISO,
  campaign:   { name, description, setting, dmNotes, partyLevel, sessionCount, status, createdAt, updatedAt },
  characters: [{ ref, ...campi }],
  notes:      [{ ...campi }],
  sessions:   [{ ...campi }],
  encounters: [{ ...campi, monsters: [...], events: [...] }],
  handouts:   [{ ...campi, imageFile }],
  maps:       [{ ...campi, imageFile }],
  files:      { "<nome>": "<base64>" }
}
```

- Gli identificativi numerici **non** viaggiano, tranne `ref` dei personaggi: serve a ricollegare il
  `characterId` scritto negli eventi del combattimento (`combatant-add`).
- Gli ID dei combattenti (`pc-3`, `m-7-1`) sono stringhe opache, coerenti **dentro** il registro e
  con i segnalini delle mappe: viaggiano così come sono, e restano coerenti fra loro.
- `live_state` non viaggia (AC8). `app_settings` nemmeno: sono dell'installazione.
- Date come stringhe ISO.

## Moduli

```
src/core/archive/      puro: formato, versione, nome del file, riscrittura del characterId
src/features/archive/  slice «Archivio»
  archive.ts           exportCampaign(db, id, files) · importCampaign(db, archive, files)
  schema.ts            Zod del file (confine esterno, AGENTS.md §8)
  queries.ts · components/ · feature.config.ts
src/app/api/archivio/[id]/route.ts   GET  → il file, come allegato
src/app/api/archivio/route.ts        POST → importa, risponde { id }
```

`archive.ts` riceve il database e un archivio di file **come parametri**: così il test del giro
completo (AC4) usa un database SQLite vero su file temporaneo, con le migrazioni reali.

## Import

1. Dimensione massima 200 MB; `JSON.parse`; Zod. Qualunque errore → messaggio italiano, niente scritto.
2. Ogni immagine: base64 → byte → `detectImageType` → salvata con un **nome nuovo** generato dall'app.
3. Una sola transazione per tutte le righe. Se fallisce, le immagini appena scritte si cancellano (AC6).

L'import passa da una **route**, non da una Server Action: le Server Actions hanno un limite di
corpo (10 MB qui) e un archivio con mappe lo supera. La route accetta solo `application/json` e
controlla l'`Origin`: una pagina web esterna non può importare nulla nel PC del DM.

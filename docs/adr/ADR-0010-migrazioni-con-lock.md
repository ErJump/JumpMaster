# ADR-0010 — Migrazioni automatiche protette da un lock fra processi

- **Stato:** accepted
- **Data:** 2026-09-23

## Contesto

Le migrazioni si applicano da sole all'apertura del database, perché l'utente è un DM e non uno
sviluppatore (decisione presa risolvendo il fallimento CI del 22 settembre).

Al push di M3 la CI è fallita con `table srd_backgrounds already exists`. Causa: `next build`
raccoglie i dati delle pagine con **più processi in parallelo**, ognuno apre il database e ognuno
applica le migrazioni. Due processi leggono «nessuna migrazione applicata» nello stesso istante e
creano le stesse tabelle.

Il difetto esisteva dall'introduzione delle migrazioni automatiche: **le CI precedenti erano
passate per fortuna di tempi**, e così le build «da clone fresco» fatte in locale (sei su sei
riuscite). Riprodotto invece in modo deterministico con otto processi che aprono lo stesso
database vuoto nello stesso istante: **9 round su 10 falliti**.

## Decisione

Aprire il database con `openDatabase()` (`src/db/open.ts`), che esegue sotto un **lock esclusivo
fra processi** tutto ciò che tocca lo schema o la modalità del giornale: apertura, `journal_mode`,
migrazioni. Chi arriva dopo trova le migrazioni già applicate e `migrate` non fa nulla.

Il lock è un file creato in modalità `wx` (creazione atomica: fallisce se esiste), con attesa
sincrona, timeout di 30 secondi e rimozione dei lock orfani più vecchi di 30 secondi. Nessuna
dipendenza nuova.

`openDatabase()` è usata dal client dell'app, da `npm run db:migrate` e dall'import dell'SRD.

## Conseguenze

- Stessa batteria di otto processi: **0 round falliti su 10**, tutti vedono lo schema completo.
- Si può lanciare `npm run db:migrate` o `npm run srd:import` con il dev server acceso.
- `npm run setup` funziona su una copia appena clonata: l'import crea e migra il database da sé.
  (Prima non funzionava: un secondo bug, introdotto nella correzione precedente.)
- Il lock vive accanto al database in `data/`, già fuori da git.

## Alternative scartate

- **Saltare le migrazioni solo durante `next build`** (`NEXT_PHASE`) — avrebbe sistemato la CI ma
  lasciato il difetto per ogni altro caso di più processi, come dev server e script insieme.
- **Transazione `BEGIN IMMEDIATE` attorno a `migrate`** — il migratore di Drizzle apre già la sua
  transazione, e SQLite non ne ammette di annidate.
- **Riprovare in caso di «already exists»** — nasconde il problema invece di risolverlo, e lascia
  aperti gli stati intermedi.

## Lezione

Una prova che passa non esclude una race. Quando il codice gira in più processi, la verifica va
fatta **forzando la concorrenza**, non ripetendo lo scenario normale.

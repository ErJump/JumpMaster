---
id: SPEC-0013
slug: mappa-del-mondo
title: Mappa del mondo con segnaposto collegati alle note
milestone: M5
status: done
updated: 2026-09-23
---

# SPEC-0013 — Mappa del mondo

## Perché

«Dov'era Vallaki rispetto al castello?» Una campagna vive su una geografia. La mappa del mondo è
il punto dove quella geografia incontra le note: ogni luogo segnato porta alla sua pagina.

## Cosa

Una mappa di tipo «mondo» (stessa entità di SPEC-0012, senza griglia) con **segnaposto**: un
punto, un nome, e un collegamento a una nota. Alcuni segnaposto sono noti ai giocatori, altri no.

## Criteri di accettazione

- [x] **AC1** — Posso creare una mappa del mondo caricando un'immagine.
- [x] **AC2** — Cliccando sulla mappa aggiungo un segnaposto con un nome.
- [x] **AC3** — Il nome del segnaposto funziona come `[[Titolo]]`: porta alla nota (o al personaggio)
      con quel nome, o propone di crearla.
- [x] **AC4** — Posso spostare, rinominare ed eliminare un segnaposto.
- [x] **AC5** — Ogni segnaposto può essere **noto ai giocatori** o no; mostrando la mappa nella
      Vista, arrivano solo quelli noti.
- [x] **AC6** — Una nota elenca le mappe in cui compare come segnaposto.

## Fuori ambito
Percorsi, distanze di viaggio, calendario di viaggio.

## Verifica eseguita — 2026-09-23

| AC | Cosa è successo |
|---|---|
| AC1 | «La valle di Barovia», JPEG 1200×800 creato dal modulo: dimensioni lette dai byte |
| AC2 | Due clic in modalità «Aggiungi luogo» → due segnaposto |
| AC3 | «Villaggio di Barovia» → «Apri» porta a `/note/1`; «Tana dei lupi», senza nota, propone «Crea la nota» |
| AC4 | Tana trascinata da (900,250) a (1000,600) e salvata; rinominata; tolta |
| **AC5** | Villaggio noto, tana no. Letto `/api/live`: arriva solo il villaggio, «Tana» non compare nei dati |
| AC6 | La nota «Villaggio di Barovia» elenca «🗺 La valle di Barovia» con il collegamento alla mappa |

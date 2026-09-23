---
id: SPEC-0014
slug: archivio-campagne
title: Esportare e importare una campagna
milestone: M6
status: done
updated: 2026-09-23
---

# SPEC-0014 — Esportare e importare una campagna

## Perché

Mesi di campagna vivono in un solo file, `data/jumpmaster.db`, su un solo PC. Un disco che muore,
un computer nuovo, un `git clean` di troppo, e la campagna è persa. Serve una **rete di sicurezza**
che il DM possa usare senza sapere cos'è SQLite: un pulsante che produce un file, un pulsante che
lo rimette dentro.

Lo stesso file serve anche a **passare una campagna** a un altro DM, o a portarla su un altro PC.

## Cosa

Una pagina **Archivio**: per ogni campagna un pulsante «Esporta», e un modulo per importare un file.
Il file è uno solo e contiene tutto, immagini comprese.

## Criteri di accettazione

- [x] **AC1** — Esporto una campagna in **un solo file** che contiene tutto: campagna, personaggi,
      note, sessioni, scontri con il loro registro di combattimento, handout e mappe, **immagini
      comprese**.
- [x] **AC2** — Il nome del file si legge: `jumpmaster-<campagna>-AAAA-MM-GG.json`.
- [x] **AC3** — Importando si crea una campagna **nuova**: nulla di ciò che esiste viene toccato. Se
      il nome è già in uso, la nuova si chiama «<nome> (importata)».
- [x] **AC4** — Esportare, importare ed esportare di nuovo dà lo **stesso contenuto**, a parte gli
      identificativi. Verificato da un test automatico su un database vero.
- [x] **AC5** — I riferimenti interni restano validi dopo l'import: mostri degli scontri, registro di
      combattimento (un combattimento in corso riprende da dove era), segnalini legati ai
      combattenti, immagini di handout e mappe, collegamenti `[[…]]`.
- [x] **AC6** — **Tutto o niente**: un file danneggiato o manomesso non lascia mezza campagna, e il
      messaggio d'errore dice cosa non va in italiano.
- [x] **AC7** — Il file viene controllato come qualunque input esterno: formato e versione
      dichiarati, ogni campo validato, le immagini riconosciute dai byte e non dal nome.
- [x] **AC8** — Lo stato della Vista Giocatori non viaggia: è del momento, non della campagna.
- [x] **AC9** — Funziona senza rete.

## Fuori ambito

Unire due campagne. Esportare solo una parte (una nota, uno scontro). Backup automatici a
intervalli. Sincronizzazione fra PC.

## Verifica eseguita — 2026-09-23

| AC | Cosa è successo |
|---|---|
| AC1 | «La Maledizione di Strahd» esportata: 4 personaggi, 3 note, 2 sessioni, 2 scontri (uno in corso, 5 eventi), 1 handout, 2 mappe, 3 immagini — 92 KB |
| AC2 | `jumpmaster-la-maledizione-di-strahd-2026-09-23.json`, scaricato come allegato |
| AC3 | Importata dalla pagina come «La Maledizione di Strahd (importata)»; l'originale identico. Il test prova anche «(importata 2)» |
| **AC4** | Test su database SQLite vero: esporta → importa → esporta, **stesso contenuto**. Un test confronta anche le chiavi esportate con le colonne di ogni tabella |
| AC5 | Nella copia: combattimento al round 1, di turno Elara, stessi PF; segnalini sulla mappa, immagini servite, `[[Ismark]]` porta al PNG **della copia** |
| AC6 | Test: immagine falsa → nulla importato; errore del database a metà (trigger) → né righe né immagini restano |
| AC7 | Dalla route: JSON rotto, altro formato, versione futura, colore di un segnalino manomesso, altra origine (403), `text/plain` (415) — tutti rifiutati con un messaggio in italiano, nulla scritto |
| AC8 | `live_state` non viaggia |
| AC9 | Nessuna chiamata di rete |

### Emerso provando

- **I test passavano anche con un bug.** Tolta di proposito una colonna dall'import, il giro
  completo restava verde: i dati di prova la lasciavano al valore predefinito. Ora i dati di
  prova riempiono ogni campo, e il test la rileva.
- **Immagini condivise.** Se nel file due righe citano la stessa immagine, l'import dava a
  entrambe lo stesso file: eliminando una mappa, l'altra perdeva lo sfondo. Ora ogni riga riceve
  la sua copia.
- **Eliminare una campagna lasciava le immagini sul disco** (difetto di SPEC-0002, emerso qui:
  con l'import le copie si moltiplicano). Ora si cancellano insieme alla campagna.

---
id: SPEC-0003
slug: compendio-srd
title: "Compendio SRD: bestiario, incantesimi, oggetti, regole, glossario"
milestone: M1
status: done
updated: 2026-09-22
---

# SPEC-0003 — Compendio SRD

## Perché

Un DM alle prime armi passa metà della sessione a cercare cose: la scheda di un mostro, cosa fa
*Fireball*, come funziona la copertura, cosa vuol dire "prone". Se per trovarle deve aprire un PDF o
un sito, il ritmo della serata si spezza ogni volta.

Il compendio è anche la base dati su cui poggiano tutte le milestone successive: l'encounter builder
(M2) pesca dal bestiario, il combat tracker importa gli stat block, i generatori (M4) attingono a
oggetti e mostri.

## Cosa

Cinque slice che leggono dalle tabelle `srd_*`, più l'importer che le popola.

| Slice | Contenuto | N. |
|---|---|---|
| `bestiary` | Mostri con stat block in stile Monster Manual | 334 |
| `spells` | Incantesimi | 319 |
| `items` | Oggetti magici + equipaggiamento | 362 + 237 |
| `rules` | **Sezioni di regole + condizioni** | 33 + 15 |
| `glossary` | Glossario IT↔EN | ~120 voci |

## Criteri di accettazione

### Importer
- [x] **AC1** — `npm run srd:fetch` scarica i JSON in `src/content/srd/data/` (ignorati da git).
- [x] **AC2** — `npm run srd:import` popola le tabelle e **stampa i conteggi**: 334 mostri,
      319 incantesimi, 362 oggetti magici, 237 equipaggiamenti, 33 sezioni di regole, 15 condizioni.
- [x] **AC3** — L'import è **idempotente**: rilanciarlo non duplica nulla.
- [x] **AC4** — L'import fallisce con un messaggio chiaro se i dati non sono stati scaricati.

### Bestiario
- [x] **AC5** — Elenco dei mostri con ricerca per nome, filtri per **GS**, tipo e taglia.
- [x] **AC6** — I gradi di sfida frazionari sono mostrati come **⅛ ¼ ½**, non come 0.125.
- [x] **AC7** — La scheda mostra uno stat block completo in stile Monster Manual: caratteristiche con
      modificatori calcolati, TS, abilità, sensi, linguaggi, GS, PE, tratti, azioni, azioni leggendarie.
- [x] **AC8** — I modificatori di caratteristica sono calcolati da `core/rules`, non scritti a mano.

### Incantesimi
- [x] **AC9** — Elenco con ricerca e filtri per livello, scuola e classe.
- [x] **AC10** — I trucchetti appaiono come "Trucchetto", non "Livello 0".
- [x] **AC11** — La scheda mostra tempo di lancio, gittata, componenti, durata, descrizione ed effetti
      ai livelli superiori.

### Oggetti
- [x] **AC12** — Elenco con ricerca e filtro per rarità; la rarità è evidenziata con un colore.
- [x] **AC13** — L'equipaggiamento mostra costo, peso e, per le armi, danno e proprietà.

### Regole e glossario
- [x] **AC14** — Le 33 sezioni di regole sono consultabili e ricercabili **a pieno testo**.
- [x] **AC15** — Le 15 condizioni sono presentate come schede con il nome italiano accanto a quello inglese.
- [x] **AC16** — Il glossario cerca in entrambe le lingue: "prono" trova *Prone* e viceversa.

### Trasversali
- [x] **AC17** — **Tutto funziona con il Wi-Fi staccato.** Da verificare davvero staccandolo.
- [x] **AC18** — La ricerca risponde in modo immediato su 334 mostri (indici sulle colonne cercate).
- [x] **AC19** — L'attribuzione SRD è visibile nel compendio.

## Fuori ambito

Mostri e oggetti personalizzati (M2). Open5e (M6). Traduzione dei dati di gioco (M6).

## Verifica eseguita — 2026-09-22

- **Importer**: 1729 voci, conteggi attesi rispettati, import lanciato due volte senza duplicare (AC1–AC4).
- **Bestiario**: Aboleth confrontato riga per riga col manuale — CA 17 (natural armor), 135 PF (18d10 + 36),
  GS 10 (5900 PE), modificatori +5/−1/+2/+4/+2/+4 calcolati da `core/rules`. Ricerca «gobl» → 2 di 334.
  Gradi frazionari resi ⅛ ¼ ½ (AC5–AC8).
- **Incantesimi**: Fireball completa con «Ai livelli superiori»; i trucchetti dicono «Trucchetto» (AC9–AC11).
- **Oggetti**: 599 voci con filtri per rarità e categoria (AC12–AC13).
- **Regole**: 48 voci, tabelle markdown rese correttamente. **Ricerca bilingue**: «copertura» dà gli stessi
  12 risultati di «cover», «prono» → 8, «riposo» → 6 (AC14–AC16).
- **Offline (AC17)**: `performance.getEntriesByType('resource')` su una sessione completa →
  **21 richieste, tutte a localhost:3000, zero host esterni.** I font sono auto-ospitati da `next/font`.
- **Reattività (AC18)**: il filtraggio avviene lato client su metadati leggeri, senza viaggi al server.
- **Attribuzione (AC19)**: visibile in home e in fondo a ogni scheda.

### Scoperto provando, non progettando

La ricerca italiana su dati inglesi dava **zero risultati**: «copertura» non trovava *Cover*.
Risolto con `expandQuery`, che traduce la ricerca col glossario prima di filtrare.
Espandere può solo aggiungere risultati, mai toglierne.

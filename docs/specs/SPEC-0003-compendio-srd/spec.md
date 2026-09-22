---
id: SPEC-0003
slug: compendio-srd
title: "Compendio SRD: bestiario, incantesimi, oggetti, regole, glossario"
milestone: M1
status: in-progress
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
- [ ] **AC1** — `npm run srd:fetch` scarica i JSON in `src/content/srd/data/` (ignorati da git).
- [ ] **AC2** — `npm run srd:import` popola le tabelle e **stampa i conteggi**: 334 mostri,
      319 incantesimi, 362 oggetti magici, 237 equipaggiamenti, 33 sezioni di regole, 15 condizioni.
- [ ] **AC3** — L'import è **idempotente**: rilanciarlo non duplica nulla.
- [ ] **AC4** — L'import fallisce con un messaggio chiaro se i dati non sono stati scaricati.

### Bestiario
- [ ] **AC5** — Elenco dei mostri con ricerca per nome, filtri per **GS**, tipo e taglia.
- [ ] **AC6** — I gradi di sfida frazionari sono mostrati come **⅛ ¼ ½**, non come 0.125.
- [ ] **AC7** — La scheda mostra uno stat block completo in stile Monster Manual: caratteristiche con
      modificatori calcolati, TS, abilità, sensi, linguaggi, GS, PE, tratti, azioni, azioni leggendarie.
- [ ] **AC8** — I modificatori di caratteristica sono calcolati da `core/rules`, non scritti a mano.

### Incantesimi
- [ ] **AC9** — Elenco con ricerca e filtri per livello, scuola e classe.
- [ ] **AC10** — I trucchetti appaiono come "Trucchetto", non "Livello 0".
- [ ] **AC11** — La scheda mostra tempo di lancio, gittata, componenti, durata, descrizione ed effetti
      ai livelli superiori.

### Oggetti
- [ ] **AC12** — Elenco con ricerca e filtro per rarità; la rarità è evidenziata con un colore.
- [ ] **AC13** — L'equipaggiamento mostra costo, peso e, per le armi, danno e proprietà.

### Regole e glossario
- [ ] **AC14** — Le 33 sezioni di regole sono consultabili e ricercabili **a pieno testo**.
- [ ] **AC15** — Le 15 condizioni sono presentate come schede con il nome italiano accanto a quello inglese.
- [ ] **AC16** — Il glossario cerca in entrambe le lingue: "prono" trova *Prone* e viceversa.

### Trasversali
- [ ] **AC17** — **Tutto funziona con il Wi-Fi staccato.** Da verificare davvero staccandolo.
- [ ] **AC18** — La ricerca risponde in modo immediato su 334 mostri (indici sulle colonne cercate).
- [ ] **AC19** — L'attribuzione SRD è visibile nel compendio.

## Fuori ambito

Mostri e oggetti personalizzati (M2). Open5e (M6). Traduzione dei dati di gioco (M6).

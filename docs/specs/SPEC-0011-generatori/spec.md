---
id: SPEC-0011
slug: generatori
title: Generatori per l'improvvisazione
milestone: M4
status: in-progress
updated: 2026-09-23
---

# SPEC-0011 — Generatori

## Perché

I giocatori vanno sempre dove il DM non ha preparato nulla: entrano nella taverna che non esiste,
chiedono il nome del fabbro, attaccano briga con una guardia. Un DM alle prime armi si blocca;
uno esperto improvvisa perché ha un repertorio. I generatori sono quel repertorio, a un clic.

## Cosa

Contenuto **originale** (ADR-0011), in italiano, con dati di gioco dall'SRD.

| Generatore | Produce |
|---|---|
| **PNG al volo** | nome per ascendenza, mestiere, aspetto, modo di fare, cosa vuole, un segreto |
| **Taverna** | nome, oste, atmosfera, piatto del giorno, una voce di paese |
| **Bottega** | tipo, bottegaio, merce presa dall'equipaggiamento SRD coi prezzi |
| **Voce di paese** | una diceria, vera o falsa (lo sa solo il DM) |
| **Spunto narrativo** | chi chiede, cosa, perché, e la complicazione |
| **Incontro casuale** | mostri SRD in una **fascia di difficoltà scelta**, misurata con ADR-0008 |
| **Tesoro** | monete e oggetti magici SRD adatti al livello del gruppo |

## Criteri di accettazione

- [ ] **AC1** — Ogni generatore produce un risultato con un clic, e «Rigenera» ne dà un altro.
- [ ] **AC2** — I nomi dei PNG cambiano stile secondo l'ascendenza (umano, elfo, nano, halfling,
      gnomo, mezzorco, tiefling, dragonide).
- [ ] **AC3** — Il PNG generato si salva come **PNG della campagna** in un clic.
- [ ] **AC4** — Taverne, voci e spunti si salvano come **nota** in un clic.
- [ ] **AC5** — L'incontro casuale rispetta la fascia richiesta secondo la **stessa** stima del
      costruttore di scontri, e si salva come **scontro** pronto da avviare.
- [ ] **AC6** — Il tesoro usa oggetti magici SRD di rarità adatta al livello e dichiara che la
      formula è dell'app.
- [ ] **AC7** — La bottega vende oggetti SRD con i prezzi del manuale.
- [ ] **AC8** — I generatori sono funzioni pure con generatore casuale iniettabile e test
      deterministici.
- [ ] **AC9** — Funzionano offline.
- [ ] **AC10** — Il segreto del PNG e la verità della voce di paese sono marcati come riservati al DM.

## Fuori ambito
Generazione con modelli linguistici. Mappe generate (M5).

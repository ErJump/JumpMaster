---
id: SPEC-0011
slug: generatori
title: Generatori per l'improvvisazione
milestone: M4
status: done
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

- [x] **AC1** — Ogni generatore produce un risultato con un clic, e «Rigenera» ne dà un altro.
- [x] **AC2** — I nomi dei PNG cambiano stile secondo l'ascendenza (umano, elfo, nano, halfling,
      gnomo, mezzorco, tiefling, dragonide).
- [x] **AC3** — Il PNG generato si salva come **PNG della campagna** in un clic.
- [x] **AC4** — Taverne, voci e spunti si salvano come **nota** in un clic.
- [x] **AC5** — L'incontro casuale rispetta la fascia richiesta secondo la **stessa** stima del
      costruttore di scontri, e si salva come **scontro** pronto da avviare.
- [x] **AC6** — Il tesoro usa oggetti magici SRD di rarità adatta al livello e dichiara che la
      formula è dell'app.
- [x] **AC7** — La bottega vende oggetti SRD con i prezzi del manuale.
- [x] **AC8** — I generatori sono funzioni pure con generatore casuale iniettabile e test
      deterministici.
- [x] **AC9** — Funzionano offline.
- [x] **AC10** — Il segreto del PNG e la verità della voce di paese sono marcati come riservati al DM.

## Fuori ambito
Generazione con modelli linguistici. Mappe generate (M5).

## Verifica eseguita — 2026-09-23

| AC | Cosa è successo |
|---|---|
| AC1–AC3 | PNG nano generato e salvato: nel database `role` «nano mercante di stoffe», il segreto nel campo **riservato** |
| AC4 | Taverna «Il Boccale Ridente» salvata come nota luogo, con oste, piatto, bevanda e voce |
| **AC5** | Incontro «Duro» per 2 PG di livello 5 → Flesh Golem, rapporto 2. Salvato e aperto nel costruttore: **stesso verdetto, stesso rapporto**. Un solo metro in tutta l'app |
| AC6 | 25 tesori di livello 5: solo oggetti non comuni e rari; formula dichiarata come dell'app |
| AC7 | Bottega d'artigiano: Brewer's Supplies 20 mo, Mason's Tools 10 mo — prezzi SRD invariati |
| AC8 | 21 test deterministici col generatore `seeded` |
| AC10 | Segreti dei PNG, verità delle voci e complicazioni degli spunti nel riquadro «solo per te» |

### Emerso rileggendo gli esempi generati
I test controllavano la logica, non l'italiano. Stampando esempi veri sono emersi errori che
un giocatore avrebbe notato subito:

- **articoli**: «Il Orso Zoppo» → ora «L'Orso», «Lo Scoiattolo»;
- **concordanze**: «Ponterossa», «Barbaspezzato», «Scintilla allegro», «una donna… sia stato visto»,
  «due forestieri giura»;
- **preposizioni**: «per colpa di il figlio del fabbro»;
- **senso**: una complicazione su «la persona scomparsa» attaccata a un'indagine su una morte.
  Ora le complicazioni sono **legate al tipo di incarico**.

Corretti alla radice (articolo calcolato, aggettivi con forma maschile e femminile, soggetti con
genere e numero), e **fissati come test**: una voce aggiunta in futuro che reintroduca uno di
questi errori fa fallire la CI.

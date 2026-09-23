---
id: SPEC-0016
slug: atmosfera
title: Audio d'ambiente
milestone: M6
status: done
updated: 2026-09-23
---

# SPEC-0016 — Audio d'ambiente

## Perché

La pioggia sul tetto della taverna, il vento nel passo di montagna, il fuoco che scoppietta: un
suono di fondo fa più atmosfera di tre paragrafi di descrizione, e al DM alle prime armi toglie il
peso di riempire ogni silenzio. Oggi dovrebbe cercare video su YouTube durante la sessione: pubblicità,
rete, un'altra finestra da gestire.

## Cosa

Una pagina **Atmosfera** con delle **scene** («Tempesta», «Camino della taverna», «Grotta»…). Una
scena è un mix di **strati**: suoni **generati dall'app** (pioggia, vento, fuoco, gocce, tuoni,
onde, grilli) e **tracce caricate dal DM** (la sua musica, i suoi file). Un clic cambia scena con
una dissolvenza. Il suono continua mentre il DM passa da una pagina all'altra.

I suoni generati sono sintesi in tempo reale (Web Audio): nessun file, nessuna licenza, nessuna
rete.

## Criteri di accettazione

- [x] **AC1** — Con un clic il DM crea le scene di base, pronte da usare e modificabili.
- [x] **AC2** — Un clic su una scena la fa partire; un clic su un'altra passa con una
      **dissolvenza** di un paio di secondi, senza silenzi né salti di volume.
- [x] **AC3** — Il suono **continua cambiando pagina** nel pannello DM; una barra in alto dice cosa
      suona e permette di fermarlo e regolare il volume generale.
- [x] **AC4** — Ogni scena si compone di strati, ognuno col suo volume, regolabile mentre suona.
- [x] **AC5** — Sette suoni generati: pioggia, vento, fuoco, gocce in grotta, tuoni, onde, grilli.
      Si sentono diversi fra loro e non si ripetono in modo riconoscibile.
- [x] **AC6** — Il DM carica le sue tracce (MP3, OGG, WAV, M4A, FLAC, fino a 40 MB): riconosciute
      dai byte, riprodotte in ciclo come strato di una scena.
- [x] **AC7** — Scene e tracce appartengono alla campagna e viaggiano con l'**archivio** (SPEC-0014).
- [x] **AC8** — Funziona senza rete.
- [x] **AC9** — La pagina spiega come far sentire l'audio su Discord (condividere lo schermo *con
      l'audio*).
- [x] **AC10** — La logica pura (scene, curve di dissolvenza, tempi degli eventi casuali) è in
      `core/` con i test.

## Fuori ambito

Musica generata. Playlist con più brani in sequenza. Audio nella Vista Giocatori (su Discord
l'audio passa dalla condivisione dello schermo). Effetti sonori a comando (porta che cigola…).

## Verifica eseguita — 2026-09-23

Le prove sono state fatte **misurando** l'uscita con un `AnalyserNode`, con l'uscita verso gli
altoparlanti scollegata: niente è stato ascoltato. Il giudizio a orecchio (AC5, «si sentono
diversi») resta a Giampiero.

| AC | Cosa è successo |
|---|---|
| AC1 | «Crea le scene di base» → sette scene nella campagna |
| AC2 | Da pioggia a fuoco: livello fra 0,058 e 0,155 per tutta la dissolvenza, nessun buco |
| AC3 | Cambiando pagina dal menu (atmosfera → glossario) il contesto resta `running` e la barra mostra la scena; «■» ferma: livello 0, barra sparita |
| AC4 | Fuoco portato a 0 dal cursore mentre suona: il livello scende subito; volume salvato (`"volume":0`) |
| AC5 | Tutti e sette producono segnale. Livelli tarati misurando: continui 0,08–0,12 RMS (pioggia 0,116, vento 0,115, fuoco 0,099, onde 0,078), a eventi con picchi 0,11–0,24 (grilli, gocce, tuoni) |
| AC6 | WAV caricato (88 KB), finto MP3 rifiutato, altra origine 403, `Range` → 206. Come strato: con il fuoco a zero la traccia misura 0,062 RMS, esattamente il valore atteso (seno a 0,24 × volume 0,6 sulla curva quadratica), e continua oltre i suoi 2 secondi (ciclo). Eliminata: sparisce dalla scena e dal disco |
| AC7 | Archivio versione 2 con tracce e scene; test su SQLite vero; i file della versione 1 si importano ancora |
| AC8 | Nessuna rete: sintesi in tempo reale, tracce da `data/uploads/` |
| AC9 | Riquadro «Su Discord» nella pagina |
| AC10 | 10 test in `core/ambience` (potenza costante, tempi limitati, grappoli di crepitii) |

### Emerso provando

- **Livelli sbilanciati**: alla prima misura i grilli stavano a 0,006 e il vento a 0,115. Ritarati.
- **Il primo tuono poteva arrivare dopo un minuto**: ora arriva fra 3 e 8 secondi.
- **Un test che passava senza provare nulla**: il controllo «ogni tabella è nell'archivio»
  confrontava lo schema con un elenco scritto a mano. Ora ogni tabella deve comparire nel file
  esportato con una riga vera; provato togliendo le scene dall'export (rosso).

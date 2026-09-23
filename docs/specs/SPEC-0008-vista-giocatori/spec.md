---
id: SPEC-0008
slug: vista-giocatori
title: Vista Giocatori
milestone: M3
status: in-progress
updated: 2026-09-23
---

# SPEC-0008 — Vista Giocatori

## Perché

Online il DM condivide lo schermo su Discord; in presenza magari gira il portatile verso il tavolo.
In entrambi i casi oggi i giocatori vedrebbero **tutto**: i punti ferita esatti dei mostri, le
note del DM, i segreti dei PNG. Il DM finisce per non condividere nulla, e i giocatori perdono
il colpo d'occhio sull'ordine di iniziativa e sulla scena.

Serve una **seconda finestra**, pensata per essere mostrata, che contenga solo ciò che il DM
sceglie di rivelare, e che si aggiorni da sola mentre lui gioca dal pannello di controllo.

## Cosa

Una pagina `/player` senza la navigazione del DM, con tre stati:

| Stato | Cosa vedono i giocatori |
|---|---|
| **Automatico** (default) | Il combattimento in corso, se c'è; altrimenti la schermata d'attesa della campagna |
| **Handout** | Un handout scelto dal DM: titolo, testo, immagine |
| **Oscurato** | Solo la schermata d'attesa, qualunque cosa succeda |

### Nel combattimento, i giocatori vedono
- ordine di iniziativa, round e turno corrente;
- i **PG** con i punti ferita esatti (sono i loro) e i tiri salvezza contro morte;
- i **mostri** con i punti ferita **a fasce** — Illeso, Ferito, Malconcio, In fin di vita, Morto —
  **mai i numeri**;
- condizioni e concentrazione di tutti (sono cose che si vedono in scena).

### Non vedono mai
PF esatti dei mostri, Classe Armatura, stat block, registro del DM, tiri del DM, note, segreti
dei PNG, e i combattenti che il DM ha **nascosto** (un'imboscata non ancora scattata).

### Handout
Il DM prepara in anticipo testi e immagini — una lettera, una mappa, il ritratto di un PNG — e li
mostra con un clic. Le immagini si caricano dal PC e restano in locale.

### Tiri pubblici
Un tiro fatto dalla pagina dei dadi **senza** la spunta «tiro segreto» compare per qualche secondo
anche sulla Vista Giocatori. Chiude SPEC-0004 AC8.

## Criteri di accettazione

### Finestra e sincronizzazione
- [x] **AC1** — Dal pannello del DM un pulsante apre la Vista Giocatori in una **finestra separata**.
- [x] **AC2** — La Vista si aggiorna **da sola** entro un secondo quando il DM agisce, senza ricaricare.
- [ ] **AC3** — Se la connessione cade (riavvio dell'app), la Vista si **riconnette da sola**.
- [x] **AC4** — La Vista usa una scala tipografica **maggiorata** ed è leggibile a schermo condiviso.
- [x] **AC5** — Funziona **offline** come il resto dell'app.

### Combattimento
- [x] **AC6** — In modalità automatica, avviare un combattimento lo mostra ai giocatori senza altri clic.
- [x] **AC7** — I mostri mostrano i punti ferita **a fasce**; i numeri non compaiono **da nessuna parte**
      nei dati inviati alla finestra, nemmeno nascosti nel codice della pagina.
- [x] **AC8** — I PG mostrano i punti ferita esatti e, se a terra, i tiri salvezza contro morte.
- [x] **AC9** — Il DM può **nascondere** un combattente: sparisce dalla Vista finché non lo rivela.
- [x] **AC10** — Se è il turno di un combattente nascosto, la Vista **non lo tradisce**.
- [x] **AC11** — La vista pubblica è calcolata da una funzione **pura** con test che verificano
      l'assenza di dati riservati.

### Regia
- [x] **AC12** — Una pagina «Regia» mostra cosa vedono ora i giocatori e permette di passare fra
      automatico, handout e oscurato.
- [x] **AC13** — Posso creare, mostrare ed eliminare handout con titolo, testo e immagine.
- [x] **AC14** — Le immagini accettate sono solo PNG, JPEG, WebP e GIF, fino a 10 MB; il nome del file
      sul disco è generato dall'app, mai quello scelto dall'utente.
- [x] **AC15** — Un tiro non segreto dalla pagina dei dadi compare sulla Vista; un tiro segreto **no**.

## Fuori ambito
Mappe tattiche (M5). Musica e ambienti sonori (M6). Interazione dei giocatori con la Vista.

## Stato della verifica — 2026-09-23

Provata con **due finestre affiancate**: una scheda come pannello del DM, l'altra come Vista
Giocatori, verificando che la seconda si aggiornasse **senza essere ricaricata**.

| AC | Cosa è successo |
|---|---|
| AC2, AC6 | Avviato il combattimento: la Vista è passata da sola dall'attesa al combattimento. Danni a ogre e goblin → «Ferito» sulla Vista, senza ricaricare |
| AC7 | **Letto lo stream SSE grezzo**: assenti i 59 PF dell'ogre, `"ac"`, lo stat block, e il nome dello scontro «Imboscata» (che avrebbe rovinato la sorpresa) |
| AC8 | PG con PF esatti e barra |
| AC9 | Goblin 4 nascosto → sparito dalla Vista |
| AC10 | Turno del Goblin 4 nascosto: sulla Vista solo «Round 1», nessuna riga evidenziata, nessun nome |
| AC11 | Test sul **JSON serializzato** con numeri volutamente strani (137, 91, 23, 78) |
| AC12 | Anteprima in Regia = la pagina dei giocatori rimpicciolita. Oscura nasconde anche il combattimento in corso; Automatica lo riporta |
| AC13 | Mappa PNG generata nel browser, caricata, mostrata: titolo, immagine e testo sulla Vista |
| AC14 | File salvato come `<uuid>.png`, fuori da git. **Un SVG con script travestito da PNG è rifiutato** leggendo i byte. Percorsi `..%2F`, nomi originali, `.svg`: tutti 404 |
| AC15 | Tiro pubblico «2d6+3 = 13» sulla Vista; il 25 del tiro segreto non è mai arrivato |

**Da provare**: AC3 (riconnessione dopo un riavvio dell'app). È garantita dal protocollo —
`EventSource` si riconnette da solo e lo stream imposta `retry: 2000` — ma non l'ho provata
riavviando il server.

### Limite accettato
Durante il turno di un combattente nascosto **nessuna** riga è evidenziata. Un giocatore attento
può dedurne che «sta succedendo qualcosa». È il prezzo di non mentire: evidenziare un altro
combattente sarebbe falso, e mostrare il nascosto lo tradirebbe.

### Emerso costruendo
- **Il nome dello scontro è un dato del DM.** «Imboscata sulla Vecchia Strada» sulla Vista avrebbe
  annunciato l'imboscata. Tolto dal tipo `PlayerView`.
- **Avviso di build di Turbopack** sui percorsi calcolati a runtime: senza indicazioni il bundler
  avrebbe incluso l'intero progetto nell'output del server. Risolto con un unico `uploadPath()`
  marcato `turbopackIgnore`. Da quattro avvisi a zero.

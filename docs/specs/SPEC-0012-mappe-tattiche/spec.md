---
id: SPEC-0012
slug: mappe-tattiche
title: Mappe tattiche con segnalini e nebbia di guerra
milestone: M5
status: done
updated: 2026-09-23
---

# SPEC-0012 — Mappe tattiche

## Perché

Un combattimento solo a parole regge finché ci sono due goblin in una stanza. Con otto nemici, un
ponte e un burrone, i giocatori chiedono di continuo «quanto è lontano?», «posso arrivarci?»,
«chi è accanto a chi?». Online, senza una mappa condivisa, la scena diventa confusa.

La nebbia di guerra serve alla meraviglia: il dungeon si scopre stanza dopo stanza.

## Cosa

- Una mappa è un'**immagine** caricata dal PC con una **griglia** sopra, regolabile per farla
  combaciare con i quadretti disegnati.
- **Segnalini** per PG e mostri: presi dal combattimento in corso o creati liberi, da trascinare
  di casella in casella.
- **Nebbia di guerra**: il DM rivela e copre zone trascinando un rettangolo.
- **Misura**: trascinando si leggono le distanze in piedi, secondo l'SRD.
- La mappa si **mostra ai giocatori** nella Vista, con la nebbia opaca e solo i segnalini visibili.

## Criteri di accettazione

### Mappa e griglia
- [x] **AC1** — Posso creare una mappa caricando un'immagine (PNG, JPEG, WebP, GIF fino a 10 MB).
- [x] **AC2** — Posso regolare dimensione e scostamento della griglia finché combacia coi
      quadretti disegnati, e nasconderla se l'immagine ne ha già una.
- [x] **AC3** — Le dimensioni dell'immagine le legge l'app dai byte del file, non le chiede al DM.

### Segnalini
- [x] **AC4** — Posso aggiungere i combattenti dello scontro in corso come segnalini in un clic.
- [x] **AC5** — Posso aggiungere segnalini liberi con nome, colore e taglia (1×1, 2×2, 3×3, 4×4).
- [x] **AC6** — Trascino un segnalino e si aggancia alla casella.
- [x] **AC7** — Un segnalino legato a un combattente morto appare spento.
- [x] **AC8** — Posso nascondere un segnalino ai giocatori.

### Nebbia
- [x] **AC9** — Trascinando un rettangolo rivelo o copro le caselle; «Rivela tutto» e «Copri tutto».
- [x] **AC10** — Il DM vede la nebbia semitrasparente; i giocatori la vedono **opaca**.

### Misura
- [x] **AC11** — Trascinando in modalità misura leggo la distanza: **5 ft per casella, diagonali
      comprese** (SRD 5.1, «Movement and Position»).

### Vista Giocatori
- [x] **AC12** — Un clic mostra la mappa ai giocatori; si aggiorna da sola quando muovo segnalini o
      rivelo zone.
- [x] **AC13** — Ai giocatori **non arrivano** i segnalini sotto la nebbia, né quelli nascosti o di
      combattenti nascosti — verificato sui dati inviati, non a occhio.
- [x] **AC14** — Se c'è un combattimento in corso, la Vista mostra anche di chi è il turno.
- [x] **AC15** — La logica di griglia, distanze, nebbia e vista pubblica è pura e testata.

## Fuori ambito
Linee di vista e luci dinamiche. Muri. Disegno a mano libera. Mappe generate.

## Verifica eseguita — 2026-09-23

| AC | Cosa è successo |
|---|---|
| AC1, AC3 | «La cripta sotto la chiesa», PNG 1050×700: dimensioni lette dai byte. Verificato anche su JPEG e GIF veri |
| AC2 | Griglia portata da 53 a 70 px → 15×10 caselle; «Mostra la griglia» spenta e riaccesa, salvata |
| AC4 | «Aggiungi i 3 combattenti dello scontro»: Flesh Golem, Elara, Gorm in un clic |
| AC5 | «Orso bruno» 2×2: salvato con `size: 2`, disegnato con raggio doppio (58,8 contro 29,4) |
| AC6 | Golem trascinato in (9,4), Elara in (3,2) nello stesso istante: entrambi salvati, identici dopo il ricaricamento |
| AC7 | Coperto dal test: mostro a 0 PF → segnalino spento; PG privo di sensi → acceso |
| AC8 | Gorm nascosto: sparisce dalla Vista senza ricaricare |
| AC9 | Rettangolo 7×6 rivelato (42 caselle); «Rivela tutto» → 0 caselle coperte, «Copri tutto» → 150 |
| AC10 | Nebbia a 0,55 nell'editor, a 1 nella Vista (108 caselle coperte) |
| AC11 | Righello da (3,2) a (7,4): 20 ft |
| AC12 | Turno passato a Elara nel combat tracker → «Tocca a Elara Ventoluna» e anello attivo, senza ricaricare |
| **AC13** | Letto lo stream `/api/live`: arrivano **solo** Elara e Gorm; il golem sotto la nebbia non esiste nei dati |
| AC14 | Il turno si annuncia — ma non quello di chi sta sotto la nebbia (vedi sotto) |
| AC15 | 22 test in `core/maps` |

### Emerso provando

- **Il turno tradiva la nebbia.** Il segnalino del golem non arrivava ai giocatori, ma la riga
  «Tocca a Flesh Golem» sì: il nome c'era comunque. Ora il turno si annuncia solo se chi agisce
  ha almeno un segnalino visibile (o non ne ha su questa mappa). Scritto prima il test che falliva.
- **Il righello segnava 0 ft.** I gestori del puntatore leggevano lo stato del render precedente:
  con un trascinamento veloce la misura, e peggio la posizione finale dei segnalini, restavano
  indietro. Ora la posizione finale si calcola dall'evento di rilascio e lo stato vivo sta in un ref.
- **Danno massiccio.** Il primo test dei «morti» usava 99 danni su un PG da 20 PF: per l'SRD è
  morte istantanea, e il riduttore aveva ragione. Il test ora usa 25 (5 di avanzo).

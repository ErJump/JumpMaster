---
id: SPEC-0007
slug: combat-tracker
title: Combat Tracker
milestone: M2
status: in-progress
updated: 2026-09-22
---

# SPEC-0007 — Combat Tracker

## Perché

**È lo strumento più importante dell'app.** Durante un combattimento il DM tiene insieme, in tempo
reale e davanti a quattro persone che aspettano: l'ordine di iniziativa, i punti ferita di sei
mostri, chi è avvelenato, chi sta concentrandosi su un incantesimo, chi ha fallito due tiri salvezza
contro morte, e di chi è il turno. È qui che un DM alle prime armi si impantana, perde il filo, e la
serata rallenta.

E sbaglierà: digiterà 18 invece di 8, applicherà il danno alla creatura sbagliata, passerà il turno
troppo presto. **Per questo l'annulla non è un lusso** ([ADR-0005](../../adr/ADR-0005-combat-tracker-event-sourced.md)).

## Cosa

Un combattimento è un **registro di eventi in sola aggiunta**. Lo stato corrente è la riduzione
degli eventi; annullare significa ignorare l'ultimo.

### Eventi

`combat-start` · `combatant-add` · `combatant-remove` · `initiative-set` · `damage` · `heal` ·
`temp-hp` · `condition-add` · `condition-remove` · `concentration-set` · `concentration-break` ·
`death-save` · `death-save-reset` · `turn-next` · `turn-prev` · `note`

### Le regole dei punti ferita, fatte bene

Sono il punto in cui l'app deve essere **giusta**, perché il DM non le sa ancora
(SRD 5.1, «Damage and Healing»):

- I **punti ferita temporanei** assorbono il danno per primi e **non si sommano**: se ne arrivano
  altri si tiene il valore più alto.
- A **0 punti ferita** un personaggio cade privo di sensi e comincia i tiri salvezza contro morte.
- Subire danni **mentre si è a 0** costa un fallimento; un colpo critico ne costa **due**.
- **Danno massiccio**: se il danno residuo dopo essere arrivati a 0 eguaglia o supera i punti ferita
  massimi, la morte è **istantanea**.
- Tre successi: stabile. Tre fallimenti: morto.
- Qualunque cura sopra 0 riporta coscienza e **azzera i tiri salvezza contro morte**.
- I mostri, salvo diversa scelta del DM, muoiono a 0 senza tiri salvezza.

## Criteri di accettazione

### Avvio
- [ ] **AC1** — Da uno scontro (SPEC-0006) posso avviare il combattimento: i mostri entrano
      numerati (`Goblin 1`, `Goblin 2`…) e i PG della campagna entrano automaticamente.
- [ ] **AC2** — I punti ferita dei mostri si possono tirare dai dadi vita **o** usare la media,
      scegliendo con un clic.
- [ ] **AC3** — Posso inserire l'iniziativa di ciascuno; quella dei mostri si può **tirare
      automaticamente** con il modificatore di Destrezza del loro stat block.
- [ ] **AC4** — L'ordine si dispone per iniziativa decrescente; a parità decide il modificatore.

### Durante
- [ ] **AC5** — Il turno corrente è **inequivocabile a colpo d'occhio**, anche a schermo condiviso.
- [ ] **AC6** — «Turno successivo» avanza e, chiuso il giro, incrementa il **round**.
- [ ] **AC7** — Infliggere danno o curare richiede **un numero e un clic**, con scorciatoia da tastiera.
- [ ] **AC8** — I punti ferita temporanei assorbono per primi e non si sommano.
- [ ] **AC9** — Le 15 condizioni si applicano e si tolgono come etichette, con la descrizione a portata.
- [ ] **AC10** — La concentrazione è segnata sul combattente; quando subisce danno l'app **ricorda
      il tiro salvezza su Costituzione** con la CD giusta: 10 oppure metà del danno, il maggiore.
- [ ] **AC11** — A 0 punti ferita un PG passa ai tiri salvezza contro morte, con tre successi e tre
      fallimenti cliccabili.
- [ ] **AC12** — Danni subiti a 0 punti ferita aggiungono un fallimento, due se critico.
- [ ] **AC13** — Il danno massiccio uccide all'istante e l'app **dice perché**.
- [ ] **AC14** — Una cura da 0 riporta coscienza e azzera i tiri salvezza contro morte.
- [ ] **AC15** — I mostri con azioni leggendarie mostrano un **promemoria alla fine di ogni turno altrui**.
- [ ] **AC16** — Lo stat block del combattente è consultabile senza uscire dal combattimento.
- [ ] **AC17** — Gli attacchi nello stat block sono **cliccabili**: tirano colpire e danno con
      `core/dice`, e il risultato appare nel registro.

### Annulla
- [ ] **AC18** — **Annulla** ripristina lo stato esattamente com'era prima dell'ultima azione.
- [ ] **AC19** — Si può annullare **più volte di seguito**, risalendo il registro.
- [ ] **AC20** — Il registro del combattimento è visibile e leggibile in italiano.

### Trasversali
- [ ] **AC21** — Il combattimento **sopravvive a un riavvio dell'app**: è nel database, non in memoria.
- [ ] **AC22** — La riduzione degli eventi è una funzione **pura** in `core/events`, con test sui
      casi limite delle regole dei punti ferita.
- [ ] **AC23** — Posso concludere il combattimento; lo scontro passa a `done`.

## Fuori ambito

Mappa tattica e posizioni (M5). Vista Giocatori (M3). Assegnazione automatica dei PE. Azioni di tana.

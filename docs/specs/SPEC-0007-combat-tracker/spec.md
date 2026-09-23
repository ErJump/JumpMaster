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
- [x] **AC1** — Da uno scontro (SPEC-0006) posso avviare il combattimento: i mostri entrano
      numerati (`Goblin 1`, `Goblin 2`…) e i PG della campagna entrano automaticamente.
- [ ] **AC2** — I punti ferita dei mostri si possono tirare dai dadi vita **o** usare la media,
      scegliendo con un clic.
- [x] **AC3** — Posso inserire l'iniziativa di ciascuno; quella dei mostri si può **tirare
      automaticamente** con il modificatore di Destrezza del loro stat block.
- [x] **AC4** — L'ordine si dispone per iniziativa decrescente; a parità decide il modificatore.

### Durante
- [x] **AC5** — Il turno corrente è **inequivocabile a colpo d'occhio**, anche a schermo condiviso.
- [x] **AC6** — «Turno successivo» avanza e, chiuso il giro, incrementa il **round**.
- [x] **AC7** — Infliggere danno o curare richiede **un numero e un clic**, con scorciatoia da tastiera.
- [ ] **AC8** — I punti ferita temporanei assorbono per primi e non si sommano.
- [ ] **AC9** — Le 15 condizioni si applicano e si tolgono come etichette, con la descrizione a portata.
- [x] **AC10** — La concentrazione è segnata sul combattente; quando subisce danno l'app **ricorda
      il tiro salvezza su Costituzione** con la CD giusta: 10 oppure metà del danno, il maggiore.
- [x] **AC11** — A 0 punti ferita un PG passa ai tiri salvezza contro morte, con tre successi e tre
      fallimenti cliccabili.
- [x] **AC12** — Danni subiti a 0 punti ferita aggiungono un fallimento, due se critico.
- [x] **AC13** — Il danno massiccio uccide all'istante e l'app **dice perché**.
- [x] **AC14** — Una cura da 0 riporta coscienza e azzera i tiri salvezza contro morte.
- [ ] **AC15** — I mostri con azioni leggendarie mostrano un **promemoria alla fine di ogni turno altrui**.
- [x] **AC16** — Lo stat block del combattente è consultabile senza uscire dal combattimento.
- [x] **AC17** — Gli attacchi nello stat block sono **cliccabili**: tirano colpire e danno con
      `core/dice`, e il risultato appare nel registro.

### Annulla
- [x] **AC18** — **Annulla** ripristina lo stato esattamente com'era prima dell'ultima azione.
- [x] **AC19** — Si può annullare **più volte di seguito**, risalendo il registro.
- [x] **AC20** — Il registro del combattimento è visibile e leggibile in italiano.

### Trasversali
- [x] **AC21** — Il combattimento **sopravvive a un riavvio dell'app**: è nel database, non in memoria.
- [x] **AC22** — La riduzione degli eventi è una funzione **pura** in `core/events`, con test sui
      casi limite delle regole dei punti ferita.
- [x] **AC23** — Posso concludere il combattimento; lo scontro passa a `done`.

## Fuori ambito

Mappa tattica e posizioni (M5). Vista Giocatori (M3). Assegnazione automatica dei PE. Azioni di tana.

## Stato della verifica — 2026-09-23

Combattimento **giocato davvero** nel browser: «Imboscata sulla Vecchia Strada», 4 goblin e un
ogre contro Elara (maga) e Gorm (guerriero), **sbagliando apposta e annullando**.

### Provato nel browser
| AC | Cosa è successo |
|---|---|
| AC1, AC3 | 7 combattenti; goblin **numerati** 1–4 con iniziativa già tirata; PG con «—» rosso e un banner che dice di chiederla ai giocatori |
| AC4 | Scritte le iniziative dei PG (16, 12): ordine ricalcolato correttamente |
| AC5 | Turno corrente con bordo dorato spesso, ▶ e nome ingrandito |
| AC7 | Danno con un numero e un clic; il danno tirato dallo stat block **precompila il campo** |
| AC10 | 9 danni su Elara in concentrazione → «TS su Costituzione con CD 10» calcolato da solo; «Riuscito» chiude il promemoria e l'incantesimo resta |
| AC11, AC14 | Elara a 0 → pannello dei tiri contro morte; un fallimento; una cura di 5 la rimette in piedi e **azzera** i salvezza |
| AC16, AC17 | Stat block del goblin nel pannello; attacco e danno cliccabili. Il goblin ha tirato davvero un **20 naturale** e l'app l'ha segnalato |
| AC18 | **Errore voluto**: 40 danni a Gorm invece di 4 → Gorm a 0. Il pulsante diceva «Annulla (40 danni)». Ctrl+Z → Gorm di nuovo a 39/44 |
| AC20 | Registro in italiano che si legge come un racconto |
| **AC21** | **Pagina ricaricata: stato identico al dettaglio** — round, turno, ogni riga, PF, etichette, 15 voci di registro. Nel database: 8 eventi di preparazione, 15 azioni nell'ordine esatto, il danno sbagliato scartato |
| AC23 | Concluso con conferma; lo scontro torna «Concluso» e si può rigiocare |

### Coperto dai test unitari, non ancora provato a mano
AC6 (cambio di round), AC8 (temporanei), AC12 (critico a terra), AC13 (danno massiccio),
AC19 (annulla ripetuto).

### Da provare
- **AC2** — solo i PF **medi** sono stati provati; i PF tirati dai dadi vita no.
- **AC9** — le condizioni non sono state applicate a mano nel browser.
- **AC15** — il promemoria delle azioni leggendarie: nello scontro di prova non c'erano mostri leggendari.

### Emerso giocando, non progettando
1. **Il turno si fermava sui mostri morti.** Nessun DM vuole passare dal turno di un goblin già
   ucciso. Ora «Turno successivo» li salta — ma **non** salta i PG privi di sensi, che nel loro
   turno tirano i salvezza contro morte. Sei test nuovi nel riduttore.
2. **Mancava «concentrazione mantenuta».** Il promemoria compariva ma non c'era modo di chiuderlo
   se il tiro riusciva. Aggiunto l'evento `concentration-kept`.
3. **Il danno del critico non raddoppiava i dadi.** Il 20 naturale del goblin l'ha fatto notare:
   il danno tirato subito dopo usava 1d6+2. Ora `criticalDamage` in `core/dice` raddoppia i dadi e
   **non** il modificatore (2d6+2, non 2d6+4), e il tracker lo applica al danno della stessa azione
   dopo un 20. Verificato forzando un 20: 2d6+2, poi di nuovo 1d6+2 al tiro seguente.

---
id: SPEC-0005
slug: personaggi-e-gruppo
title: Personaggi (PG e PNG) e Party Dashboard
milestone: M2
status: in-progress
updated: 2026-09-22
---

# SPEC-0005 — Personaggi e Party Dashboard

## Perché

Un DM alle prime armi interrompe il ritmo del gioco ogni due minuti per chiedere «qual è la tua
Classe Armatura?», «quanto fa la tua Percezione passiva?», «fammi un tiro salvezza su Destrezza,
quanto hai?». Ogni domanda spezza la scena e sposta l'attenzione dalla storia ai numeri.

Quei numeri cambiano di rado: si inseriscono una volta e restano lì. Averli sott'occhio significa
poter dire «il ladro nota la porta segreta» senza chiedere niente a nessuno.

Serve anche un registro dei **PNG**: chi il gruppo ha incontrato, dove, cosa vuole e cosa nasconde.
È la memoria della campagna, e un DM che dimentica il nome di un PNG perde credibilità.

## Cosa

Una sola slice `characters` con due tipi di scheda e una vista d'insieme.

### Personaggi giocanti

Il DM trascrive dalla scheda del giocatore, una volta sola:

| Campo | Note |
|---|---|
| `name`, `playerName` | chi è e chi lo gioca |
| `className`, `subclass`, `race`, `level` | identità |
| `ac`, `maxHp`, `speed` | numeri del tavolo |
| sei caratteristiche | da cui l'app calcola **tutto il resto** |
| competenze nei tiri salvezza | quali sono competenti |
| competenze ed **esperienza** nelle abilità | per i punteggi passivi |

Da questi l'app calcola con `core/rules`: modificatori, bonus di competenza, modificatore di
iniziativa, tiri salvezza, **Percezione / Indagare / Intuizione passive**.

### Personaggi non giocanti

| Campo | Note |
|---|---|
| `name`, `role` | «Ireena Kolyana», «figlia del borgomastro» |
| `location` | dove si trova |
| `disposition` | amichevole · neutrale · ostile · sconosciuta |
| `appearance`, `voice` | come descriverlo al tavolo |
| `secret` | ⚠️ cosa nasconde — **mai** nella Vista Giocatori (M3) |
| `srdMonsterSlug` | stat block dal bestiario, se dovesse combattere |
| `notes` | |

## Criteri di accettazione

### Schede
- [ ] **AC1** — Posso creare un PG indicando almeno il nome; compare nell'elenco della campagna.
- [ ] **AC2** — Inseriti i sei punteggi e il livello, l'app mostra modificatori, bonus di competenza
      e modificatore di iniziativa **calcolati**, senza che io li digiti.
- [ ] **AC3** — Segnando la competenza in Percezione, la Percezione passiva aumenta del bonus di
      competenza; segnando l'**esperienza**, aumenta del doppio.
- [ ] **AC4** — I tiri salvezza mostrano il bonus di competenza solo dove sono competente.
- [ ] **AC5** — Posso creare un PNG con i suoi campi narrativi e collegarlo a uno stat block del bestiario.
- [ ] **AC6** — Il campo «segreto» di un PNG è visivamente marcato come riservato.
- [ ] **AC7** — Posso modificare ed eliminare una scheda; l'eliminazione chiede conferma.
- [ ] **AC8** — I personaggi appartengono alla campagna attiva: cambiando campagna vedo altri personaggi.
- [ ] **AC9** — Senza campagna attiva la pagina lo spiega e invita a sceglierne una, invece di rompersi.

### Party Dashboard
- [ ] **AC10** — Una vista mostra tutti i PG del gruppo su una riga ciascuno, con **CA**,
      **PF massimi**, **Percezione passiva** e **modificatore di iniziativa** leggibili a distanza.
- [ ] **AC11** — La vista evidenzia il valore **più alto** di Percezione passiva del gruppo: è il
      numero che il DM confronta con la CD di un nascondiglio.
- [ ] **AC12** — Mostra i tiri salvezza di tutto il gruppo in tabella, per risolvere in un colpo solo
      un effetto ad area.
- [ ] **AC13** — È leggibile a schermo condiviso: corpo ≥ 16px, contrasto ≥ 4.5:1.
- [ ] **AC14** — Il livello medio del gruppo si propaga alla campagna, dove lo userà il costruttore
      di scontri (SPEC-0006).

## Fuori ambito

Creazione guidata del personaggio (l'SRD ha 9 razze e 1 background: non basta). Inventario dei PG.
Slot incantesimo. Import da D&D Beyond.

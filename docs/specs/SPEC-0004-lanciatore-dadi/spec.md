---
id: SPEC-0004
slug: lanciatore-dadi
title: Lanciatore di dadi
milestone: M1
status: in-progress
updated: 2026-09-22
---

# SPEC-0004 — Lanciatore di dadi

## Perché

Il DM **preferisce i dadi veri** e li userà per i tiri che contano. Il lanciatore serve per i casi in
cui i dadi fisici sono scomodi: tirare i PF di otto goblin, un tiro segreto che i giocatori non devono
vedere, le tabelle casuali dei generatori.

Il vero valore però non è la pagina "tira un dado": è il **motore** in `core/dice`, che in M2
renderà cliccabili gli attacchi dentro gli stat block ("Morso +9, 1d10+5" → tira da solo) e in M4
alimenterà i generatori.

## Cosa

Un parser e un motore per la notazione standard, più un'interfaccia essenziale.

### Notazione supportata

| Sintassi | Significato |
|---|---|
| `d20`, `3d6` | tiro base |
| `1d20+5`, `2d6-1` | con modificatore |
| `4d6kh3` | tieni i 3 più alti (*keep highest*) |
| `2d20kh1` | vantaggio |
| `2d20kl1` | svantaggio |
| `4d6dl1` | scarta il più basso (*drop lowest*) |
| `8d6/2` | dimezzato (TS riuscito contro *Fireball*) |
| `2d8+1d6+3` | più termini |
| `d%`, `d100` | percentuale |

## Criteri di accettazione

- [ ] **AC1** — Il parser gestisce tutta la notazione della tabella e **rifiuta** l'input non valido
      con un messaggio comprensibile in italiano.
- [ ] **AC2** — Il risultato mostra i **singoli dadi**, non solo il totale: il DM deve poter vedere
      cosa è uscito (e i giocatori fidarsi).
- [ ] **AC3** — I dadi scartati sono mostrati barrati, non nascosti.
- [ ] **AC4** — Un **20 naturale** e un **1 naturale** su un d20 sono evidenziati.
- [ ] **AC5** — Pulsanti rapidi per d4, d6, d8, d10, d12, d20, d100.
- [ ] **AC6** — Interruttori vantaggio/svantaggio che riscrivono il tiro in `2d20kh1` / `2d20kl1`.
- [ ] **AC7** — Cronologia degli ultimi 50 tiri, con la possibilità di ripetere un tiro con un clic.
- [ ] **AC8** — Modalità **tiro segreto**: il risultato non finirà nella Vista Giocatori (M3).
- [ ] **AC9** — Invio lancia; il campo mantiene il fuoco per tirare di nuovo subito.
- [ ] **AC10** — I limiti sono sensati: max 100 dadi e max 1000 facce, con errore chiaro oltre.
- [ ] **AC11** — Test unitari su parser e motore, con generatore casuale **iniettabile** per rendere i
      tiri deterministici nei test.

## Fuori ambito

Dadi 3D animati. Sincronizzazione dei tiri con i giocatori (M3).

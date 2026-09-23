---
id: SPEC-0015
slug: fonti-aperte
title: Mostri da fonti aperte (Open5e)
milestone: M6
status: done
updated: 2026-09-23
---

# SPEC-0015 — Mostri da fonti aperte

## Perché

Dopo qualche sessione i giocatori riconoscono ogni mostro dell'SRD: il goblin è un goblin, l'ogre
è un ogre. Esistono migliaia di creature pubblicate con licenze aperte, bilanciate per lo stesso
regolamento. Il DM deve poterle avere al tavolo **senza copiare stat block a mano** e senza
dipendere dalla rete durante la sessione.

## Cosa

Una pagina **Fonti aperte** con i manuali di mostri disponibili su Open5e. Un clic scarica un
manuale nel database del DM; da lì i suoi mostri stanno nel bestiario, negli scontri e nel
combattimento, come quelli dell'SRD. Vedi ADR-0013.

## Criteri di accettazione

- [x] **AC1** — La pagina elenca i manuali disponibili: nome, editore, licenza, numero di mostri,
      e se sono già scaricati.
- [x] **AC2** — Un clic scarica un manuale, mostrando l'avanzamento; alla fine i mostri sono nel
      bestiario.
- [x] **AC3** — I mostri scaricati funzionano come quelli SRD: stat block con attacchi cliccabili,
      costruttore di scontri con la stessa stima, combat tracker, stat block dei PNG.
- [x] **AC4** — Ogni stat block dice da dove viene (manuale, editore, licenza) e il testo della
      licenza si può leggere. Il bestiario si filtra per fonte.
- [x] **AC5** — Una volta scaricati, funzionano **senza rete**. Senza rete, la pagina mostra i
      manuali già scaricati e dice perché non vede gli altri.
- [x] **AC6** — Si può rimuovere un manuale. Gli scontri preparati con i suoi mostri restano
      giocabili, e prima di rimuovere il DM sa quanti scontri li usano.
- [x] **AC7** — Riscaricare un manuale lo sostituisce, senza doppioni.
- [x] **AC8** — Un download che si interrompe non lascia il manuale a metà.
- [x] **AC9** — La conversione nel formato SRD è pura e testata: GS frazionari, attacchi con i loro
      dadi, tiri salvezza e abilità, sensi, velocità, limiti d'uso (al giorno, ricarica).
- [x] **AC10** — Solo regolamento 2014: esclusi l'SRD 5.1 (già presente), l'SRD 5.2 e i sistemi
      diversi (5e 2024, A5e).
- [x] **AC11** — Il repository non contiene contenuti Open5e.

## Fuori ambito

Incantesimi e oggetti da Open5e (stessa strada, in futuro). Mostri scritti dal DM. Aggiornamenti
automatici.

## Verifica eseguita — 2026-09-23

| AC | Cosa è successo |
|---|---|
| AC1 | Catalogo: Black Flag SRD 360, Creature Codex 356, Tal'dorei 4, Tome of Beasts 1 (2023) 408, Tome of Beasts 2 383, Tome of Beasts 3 397 — con editore e licenza |
| AC2 | Tome of Beasts 2 scaricato dalla pagina: avanzamento 100 → 200 → 300 → 383, poi «✓ 383 mostri nel bestiario» |
| AC3 | Adult Boreal Dragon impaginato come un mostro SRD (tiri salvezza, abilità, Recharge 5-6, azioni leggendarie). Boreal Dragon Wyrmling aggiunto a uno scontro («Facile», copie di PF/CA/PE), poi in combattimento: stat block, «Bite: 12 danni Piercing (1d10 [9] +3 = 12)» |
| AC4 | «Fonte Tome of Beasts 2 · Kobold Press · via Open5e · OPEN GAME LICENSE Version 1.0a», con la licenza integrale (6.437 caratteri) in `/fonti/licenze/ogl-10a`. Filtro «Fonte» nel bestiario, anche dall'indirizzo (`?source=tob2`). Anche lo stat block SRD ora dice la sua fonte |
| AC5 | Server avviato con Open5e irraggiungibile: la pagina mostra il manuale scaricato e spiega perché non vede gli altri; il download fallisce con un messaggio chiaro; il bestiario funziona |
| AC6 | Rimozione con conferma che dice quanti scontri e PNG usano il manuale; test su SQLite vero: lo scontro resta giocabile, la licenza non più usata sparisce |
| AC7 | Riscaricato: sempre 383, nessun doppione (test e prova reale) |
| AC8 | Test: una scrittura che fallisce a metà lascia intatto il manuale di prima; una rete che cade durante il download non tocca il database |
| AC9 | 14 test sulla conversione; in più, **tutte le 1.908 creature reali** dei sei manuali passano lo schema e i loro 3.236 danni sono dadi tirabili |
| AC10 | Esclusi SRD 5.1, Tome of Beasts (2016, sostituito dall'edizione 2023), 5e 2024 e A5e |
| AC11 | I test usano una creatura inventata; nessun dato Open5e nel repository |

### Emerso provando

- **Il tipo di danno degli attacchi è sempre vuoto in Open5e.** Si ricava dal testo cercando
  proprio i dadi dell'attacco; se il testo ne indica più d'uno («bludgeoning or slashing») resta
  vuoto, piuttosto che sbagliato. Risultato: 3.196 danni su 3.236 con il tipo.
- **94 azioni leggendarie sono ripetute fra le azioni normali** («Wing Attack (Costs 2 Actions)»).
  Visto sullo stat block del drago boreale; ora il doppione si scarta, con un test.
- Il segnaposto del costruttore di scontri diceva «334 mostri dell'SRD» anche con altri manuali:
  ora conta quelli davvero disponibili.

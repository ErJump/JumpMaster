---
id: SPEC-0010
slug: sessioni
title: "Sessioni: preparazione Lazy DM e diario"
milestone: M4
status: done
updated: 2026-09-23
---

# SPEC-0010 — Sessioni: preparazione e diario

## Perché

Un DM alle prime armi non sa **cosa** preparare né **quanto**: finisce per scrivere trenta pagine
di trama che i giocatori scavalcano in dieci minuti, oppure arriva senza nulla. Il metodo
proposto da Sly Flourish in *Return of the Lazy Dungeon Master* risponde con otto passi brevi, che
preparano ciò che serve davvero al tavolo e lasciano spazio all'improvvisazione.

Dopo la sessione, serve ricordare cosa è successo: fra due settimane nessuno lo saprà più.

## Cosa

Una **sessione** ha due facce: la preparazione (prima) e il diario (dopo). L'elenco delle sessioni
è la cronologia della campagna.

### Gli otto passi della preparazione
1. **Rivedi i personaggi** — cosa vogliono, cosa è successo loro.
2. **Un inizio forte** — la scena d'apertura, che parte in azione.
3. **Scene possibili** — tre o quattro, senza fissarne l'ordine.
4. **Segreti e indizi** — una decina, **non legati a un luogo preciso**: si rivelano dove capita.
5. **Luoghi fantastici** — pochi, ognuno con un dettaglio memorabile.
6. **PNG importanti** — con un appiglio per interpretarli.
7. **Mostri rilevanti** — cosa potrebbe servire.
8. **Ricompense** — oggetti e tesori.

I testi che spiegano ogni passo sono scritti per JumpMaster; il metodo è citato col suo autore.

### La funzione che conta
Durante o dopo la sessione il DM spunta i **segreti rivelati**. Creando la sessione successiva,
**i segreti non rivelati vengono proposti da soli**: nel metodo Lazy DM restano validi finché i
giocatori non li scoprono.

## Criteri di accettazione

- [x] **AC1** — Posso creare sessioni numerate della campagna attiva, con titolo e data.
- [x] **AC2** — Ogni sessione ha gli otto passi, ciascuno con una spiegazione breve di **a cosa serve**.
- [x] **AC3** — I segreti e gli indizi sono una lista con una casella «rivelato».
- [x] **AC4** — Creando la sessione successiva, i segreti **non rivelati** della precedente sono
      già presenti.
- [x] **AC5** — Nei testi della preparazione `[[Titolo]]` funziona come nelle note.
- [x] **AC6** — Ogni sessione ha un **diario** (markdown).
- [x] **AC7** — «Bozza dal registro» aggiunge al diario il riassunto dei combattimenti conclusi dopo
      la sessione precedente: chi è caduto, chi è finito a terra, quanti round.
- [x] **AC8** — L'elenco delle sessioni è la cronologia della campagna.
- [x] **AC9** — Il riassunto del combattimento è una funzione pura con test.
- [x] **AC10** — Le modifiche alla preparazione si salvano da sole.

## Fuori ambito
Calendario del mondo di gioco. Condivisione del diario coi giocatori.

## Verifica eseguita — 2026-09-23

Il ciclo completo di una sessione, nell'ordine in cui lo vive un DM:

1. **Preparazione** della sessione 1: inizio forte, tre segreti (uno con `[[Ismark Kolyanovich]]`),
   un PNG e un luogo collegati. Salvata **da sola** senza premere nulla, verificato nel database (AC2, AC3, AC10).
2. **Al tavolo**: i collegamenti portano alla scheda di Ismark e alla nota del villaggio; spuntato un
   segreto → barrato, contatore 1/3 (AC3, AC5).
3. **Gioco**: concluso il combattimento aperto; nel diario «Bozza dal registro» ha aggiunto il
   riassunto corretto — 1 round, 4 goblin e l'ogre ancora in piedi, nessun PG caduto (AC6, AC7).
4. **Sessione 2**: nasce coi **due segreti non scoperti** già presenti, nessuno spuntato; quello
   rivelato è rimasto nella sessione 1 (AC4).
5. Titolo e data salvati e visibili nella cronologia, che mostra i contatori dei segreti (AC1, AC8).
6. La nota del villaggio elenca «Sessione 1» fra chi la cita: le citazioni attraversano le tabelle.

### Emerso costruendo
- **Lo stato finale di un combattimento non sa chi è caduto ed è stato rialzato**, che è proprio ciò
  che un diario deve ricordare. Aggiunto `everDowned` al riduttore invece di dedurlo dalle frasi del
  registro.
- Un test ha colto un errore nel riassunto: «nessun personaggio è caduto» non compariva mai, perché
  l'elenco di chi scende a 0 contiene anche i mostri uccisi. Corretto guardando solo i PG.
- Resa: le voci brevi rese come paragrafi pieni disallineavano la casella dal testo. Aggiunta a
  `Markdown` una variante compatta.

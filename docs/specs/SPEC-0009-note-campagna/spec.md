---
id: SPEC-0009
slug: note-campagna
title: Note della campagna con collegamenti
milestone: M4
status: done
updated: 2026-09-23
---

# SPEC-0009 — Note della campagna

## Perché

Una campagna accumula luoghi, fazioni, misteri, divinità, promesse fatte dai giocatori. Senza un
posto dove metterli, il DM li perde fra quaderni e file sparsi, e a metà sessione non ricorda se
il culto di cui parla un PNG è lo stesso nominato tre settimane prima.

Il valore non è scrivere note: è **ritrovarle collegate**. Scrivendo `[[Villaggio di Barovia]]`
dentro una nota si crea un collegamento, e la pagina del villaggio mostra da sola tutte le note
che la citano.

## Cosa

- Note con titolo, categoria (luogo, fazione, trama, conoscenza, altro) e testo.
- Nel testo `[[Titolo]]` diventa un collegamento: a una nota, oppure a un **personaggio** con
  quel nome, oppure — se non esiste ancora — a «crea questa nota».
- Ogni nota mostra i **collegamenti in entrata** (chi la cita).
- Ricerca istantanea, anche nel testo.

## Criteri di accettazione

- [x] **AC1** — Posso creare, modificare ed eliminare note della campagna attiva.
- [x] **AC2** — `[[Titolo]]` nel testo diventa un collegamento cliccabile alla nota con quel titolo,
      ignorando maiuscole e accenti.
- [x] **AC3** — Se non esiste una nota ma esiste un **personaggio** con quel nome, il collegamento
      porta al personaggio.
- [x] **AC4** — Se non esiste nulla, il collegamento è marcato come mancante e crea la nota con
      quel titolo in un clic.
- [x] **AC5** — Ogni nota elenca le note che la **citano**.
- [x] **AC6** — Rinominare una nota **aggiorna** i collegamenti nelle altre, invece di romperli.
- [x] **AC7** — Ricerca istantanea su titolo e testo, con filtro per categoria.
- [x] **AC8** — Il testo supporta lo stesso markdown dei testi SRD (titoli, elenchi, grassetto, tabelle).
- [x] **AC9** — Il riconoscimento dei collegamenti è una funzione pura con test.

## Fuori ambito
Mappe e segnaposto sulle mappe (M5). Allegati. Note condivise coi giocatori.

## Verifica eseguita — 2026-09-23

- Nota «Villaggio di Barovia» con tre collegamenti: a un **personaggio** esistente (→ `/personaggi/3`),
  a una nota **mancante** con etichetta (`[[Rocca di Ravenloft|rocca]]`, in rosso tratteggiato), a
  un'altra mancante. Cliccando «rocca» si apre una nota nuova **col titolo già scritto** (AC2–AC4).
- La Rocca cita il villaggio **in minuscolo**: il collegamento funziona e il villaggio la elenca fra
  chi la cita (AC2, AC5).
- Rinominare «Rocca di Ravenloft» con un titolo esistente scritto in maiuscolo → rifiutato. Rinominata
  in «Castello di Ravenloft» → nel villaggio ora c'è `[[Castello di Ravenloft|rocca]]`, etichetta
  conservata, altri collegamenti intatti (AC6).
- Ricerca: «strahd», «reliquia», «nebbia» trovano la nota giusta cercando **nel testo** (AC7).

### Emerso provando
**I ritorni a capo delle textarea.** Lo standard HTML impone che una `<textarea>` invii `\r\n`: il
parser markdown divideva solo su `\n` e ogni riga scritta da un utente finiva con un `\r`, quindi
titoli ed elenchi non venivano riconosciuti. I testi SRD usano `\n`, per questo non era mai emerso.
Corretto normalizzando i ritorni a capo nel parser, con due test di regressione.

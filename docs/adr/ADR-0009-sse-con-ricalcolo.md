# ADR-0009 — Vista Giocatori: SSE con ricalcolo periodico

- **Stato:** accepted
- **Data:** 2026-09-23

## Contesto

La Vista Giocatori (M3) è una **seconda finestra** — sul secondo monitor, condivisa su Discord,
o su un tablet in LAN — che deve aggiornarsi da sola quando il DM agisce. Il flusso è
unidirezionale: DM → giocatori.

## Decisione

Un endpoint **Server-Sent Events** (`/api/live`) che ogni 500 ms:

1. legge dal database la campagna attiva, lo stato della regia e gli eventi del combattimento;
2. calcola la **vista pubblica** con una funzione pura (`core/events/public-view.ts`);
3. la invia **solo se è diversa** dall'ultima inviata.

Nessun bus di eventi in memoria, nessuna dipendenza nuova.

## Conseguenze

**Guadagniamo**
- **Robustezza**: nessuno stato condiviso fra moduli. Il bus in memoria si perderebbe a ogni hot
  reload di Next e non funzionerebbe fra processi diversi; il database sì.
- **Privacy per costruzione**: si confronta la vista **già filtrata**. Le azioni riservate al DM —
  una nota, un tiro segreto, i PF esatti di un mostro — non cambiano la vista pubblica e quindi
  non generano nemmeno un messaggio.
- Le Server Action non devono «notificare» nessuno: scrivono nel database e basta.

**Paghiamo**
- Fino a mezzo secondo di ritardo: al tavolo è impercettibile.
- Una lettura del database ogni 500 ms per finestra aperta: su SQLite locale sono microsecondi.

## Alternative scartate

- **WebSocket** — bidirezionale senza motivo, e richiede un server personalizzato fuori da Next.
- **Bus di eventi in memoria** (`EventEmitter` su `globalThis`) — fragile con l'hot reload e
  accoppia ogni Server Action alla Vista Giocatori, violando lo spirito dell'invariante I2.
- **Polling dal browser** — funzionerebbe, ma SSE dà riconnessione automatica gratuita e un solo
  punto in cui si decide cosa è pubblico.

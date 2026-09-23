# SPEC-0008 — Tasks

## core
- [x] `visibility-set` nel riduttore + `Combatant.hidden` + test
- [x] `public-view.ts`: `hpBand`, `toPublicCombat` + **test di non-divulgazione** sul JSON serializzato

## Dati
- [x] Schema `live_state`, `handouts` + migrazione
- [x] `queries.ts`: stato della regia, handout, `buildPlayerView`
- [x] `actions.ts`: modalità, handout (con immagine), tiro pubblico

## Rotte
- [x] `/api/live` — SSE con ricalcolo e invio solo su cambiamento, heartbeat, chiusura pulita
- [x] `/api/uploads/[file]` — solo nomi `<uuid>.<ext>`
- [x] `/player` — finestra dei giocatori
- [x] `/regia` — pannello del DM

## Integrazioni
- [x] Pulsante «Vista Giocatori» nell'intestazione del DM
- [x] Nascondi/rivela nel combat tracker
- [x] Tiro pubblico dalla pagina dei dadi

## Verifiche
- [x] Due finestre affiancate: il DM agisce, i giocatori vedono aggiornarsi
- [x] Ispezionare i messaggi SSE: nessun numero dei mostri
- [x] AC1–AC15, tranne AC3 (riconnessione) da provare riavviando il server

# ADR-0014 — App desktop: PWA e un avviatore, non Tauri (per ora)

- **Stato:** accepted
- **Data:** 2026-09-23

## Contesto

Il piano di M6 prevedeva un «wrapper Tauri»: JumpMaster come applicazione, con la sua icona,
senza terminale né barra degli indirizzi. Il bisogno vero del DM è questo; Tauri era un mezzo.

Tauri, qui, costa molto:

- JumpMaster non è un sito statico: ha un **server Node** (SQLite con `better-sqlite3`, Server
  Actions, SSE). Tauri dovrebbe portarsi dietro un runtime Node come «sidecar» (~100 MB) e il
  modulo nativo compilato per ogni piattaforma.
- Serve la toolchain **Rust**, che sul PC del DM non c'è, e su macOS firma e notarizzazione per
  non far comparire «app danneggiata».
- Ogni aggiornamento dell'app diventerebbe un nuovo pacchetto da ricostruire.

## Decisione

Lo stesso risultato pratico con ciò che c'è già:

1. **PWA installabile**: manifest, icone generate dall'app (nessun file binario nel repo). Chrome
   ed Edge la installano come app; Safari la aggiunge al Dock («File › Aggiungi al Dock»).
2. **`npm run app`**: compila se serve, avvia il server di produzione in background su una porta
   sua (3210, per non scontrarsi con lo sviluppo), aspetta che risponda e apre una finestra senza
   barra (Chrome, Edge, Brave, Vivaldi con `--app`) o il browser predefinito. Se il server è già
   acceso, lo riusa.
3. **`npm run app:install`** (macOS): crea `JumpMaster.app` in `~/Applications`, con l'icona, che
   fa esattamente `npm run app`. Doppio clic, e si parte.

Nessuna dipendenza nuova.

## Conseguenze

- Il DM apre JumpMaster dal Dock come un'app qualunque; il terminale non serve più.
- Aggiornare l'app = `git pull`; l'avviatore ricompila da solo se il codice è più nuovo della build.
- Resta necessario Node sul PC: è già un requisito (README).
- Se un giorno servirà distribuire JumpMaster a chi non ha Node, si riapre la questione Tauri
  (o Electron) con un ADR nuovo.

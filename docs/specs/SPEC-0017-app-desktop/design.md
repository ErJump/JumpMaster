# SPEC-0017 — Design

- `src/app/manifest.ts` — manifest (route di metadati di Next).
- `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/icons/[size]/route.tsx` — icone
  disegnate con `ImageResponse` (incluso in Next): SVG, nessun carattere scaricato, nessun file.
- `src/app/api/salute/route.ts` — `{ app: 'jumpmaster' }`: l'avviatore riconosce il **suo**
  server e non un altro programma sulla stessa porta.
- `scripts/app.mjs` — l'avviatore, Node puro, senza dipendenze:
  - `needsBuild()`: `.next/BUILD_ID` più vecchio di `src/`, `package.json` o `next.config.ts`;
  - server `next start -p 3210` staccato dal terminale, log in `data/app.log`, PID in `data/app.pid`;
  - finestra: Chrome/Edge/Brave/Vivaldi con `--app=URL`, altrimenti il browser predefinito;
  - `--stop`; `--install [--dest DIR]` (macOS): pacchetto `.app` con `Info.plist`, script di avvio
    col percorso assoluto di Node (le app aperte dal Finder non hanno il `PATH` del terminale),
    icona `.icns` ricavata da `/icons/512` con `sips` e `iconutil`.

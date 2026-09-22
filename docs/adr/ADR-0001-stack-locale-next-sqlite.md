# ADR-0001 — Stack locale: Next.js + SQLite

- **Stato:** accepted
- **Data:** 2026-09-22

## Contesto

L'app deve girare **in locale** sul PC del DM, funzionare **offline** durante la sessione, ed essere
condivisa su Discord tramite screen sharing. Deve inoltre restare **scalabile a livello di
funzionalità** per anni, e in futuro poter essere eventualmente ospitata (perché i giocatori la aprano
dai loro dispositivi) o impacchettata come app desktop, **senza riscritture**.

## Decisione

Web app locale servita da **`next`** (App Router) con **`react`** / **`react-dom`**, database
**SQLite** su file tramite **`better-sqlite3`**, accesso ai dati con **`drizzle-orm`** e migrazioni
con **`drizzle-kit`**, validazione al confine con **`zod`**, stile con **`tailwindcss`** e
**`@tailwindcss/postcss`**, script TypeScript eseguiti con **`tsx`**.

Il pacchetto **`server-only`** marca i moduli che non devono mai finire nel bundle client
(`src/db/client.ts`): trasforma l'invariante I4 in un errore di build invece che in un bug a runtime.

Qualità: **`typescript`**, **`eslint`** con **`eslint-config-next`** e **`@eslint/eslintrc`**,
test unitari con **`vitest`**, end-to-end con **`@playwright/test`**, tipi da **`@types/node`**,
**`@types/react`**, **`@types/react-dom`**, **`@types/better-sqlite3`**.

L'app si apre nel browser su `http://localhost:3000` ed è installabile come PWA, così da avere una
finestra dedicata senza barra del browser quando si condivide lo schermo.

## Conseguenze

**Guadagniamo**
- Un solo processo, un solo comando (`npm run dev`). Niente Docker, niente server esterni.
- Il database è **un file**: backup = copiare `data/jumpmaster.db`.
- Zero latenza e funzionamento offline garantito.
- Lo stesso codice si può ospitare domani senza riscritture.
- Server Components: poca logica finisce nel browser.

**Paghiamo**
- `better-sqlite3` è un modulo **nativo**: va in `serverExternalPackages` e non può essere importato
  da un Client Component (invariante I4). Se un domani mancassero i prebuild serve Xcode CLT.
- L'app va avviata da terminale (mitigato da uno script launcher e dall'installazione come PWA).

## Alternative scartate

- **App desktop con Tauri** — più "prodotto", ma aggiunge la toolchain Rust, build native e complica
  SQLite e il rendering server. Rallenterebbe molto lo sviluppo delle feature, che è la priorità.
  Resta in roadmap come M6, sopra questo stesso codice.
- **Electron** — stesso beneficio di Tauri con un costo in peso e memoria molto maggiore.
- **SPA Vite + backend separato** — due processi da avviare e da tenere allineati, senza vantaggi
  reali in questo scenario.
- **Postgres/MySQL** — richiederebbe un servizio sempre acceso: inaccettabile per un'app che deve
  funzionare a casa di un amico senza rete.

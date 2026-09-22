# Tech Context

> Aggiornare a ogni cambio di dipendenza o di setup.

## Stack

| Ambito | Scelta | Versione | Note |
|---|---|---|---|
| Runtime | Node.js | ≥ 22 (dev su 24.20) | |
| Framework | Next.js (App Router) | 16.3.5 | Server Components di default |
| UI | React | 19.3.0 | |
| Stile | Tailwind CSS | 4.3.3 | config CSS-first, niente `tailwind.config.js` |
| DB | SQLite via `better-sqlite3` | 13.0.3 | nativo, **solo server**; verificato su Node 24 |
| ORM | Drizzle ORM / Kit | 0.45.3 / 0.31.11 | `casing: snake_case` |
| Validazione | Zod | 4.6.5 | al confine, in `schema.ts` |
| Test unitari | Vitest | 5.0.1 | `src/**/*.test.ts` |
| Test e2e | Playwright | 1.63.0 | |
| Lint | ESLint + eslint-config-next | **9.39.5** / 16.3.5 | flat config nativi (ADR-0006) |
| Linguaggio | TypeScript | 5.9.3 | strict + `noUncheckedIndexedAccess` |

## Setup da zero

```bash
npm install
npm run setup     # scarica e importa i dati SRD (serve la rete, una volta sola)
npm run dev       # http://localhost:3000
```

Il database finisce in `data/jumpmaster.db` (in `.gitignore`). La cartella e le tabelle si
creano da sole al primo avvio: `src/db/client.ts` crea la directory e applica le migrazioni.

## Dati SRD

Fonte: [`5e-bits/5e-database`](https://github.com/5e-bits/5e-database) — MIT, cartella `src/2014/en/`.
Scaricati in `src/content/srd/data/` (in `.gitignore`, rigenerabili con `npm run srd:fetch`) e
importati nelle tabelle `srd_*`.

Conteggi attesi dopo l'import:

| Dataset | N. |
|---|---|
| Monsters | 334 |
| Spells | 319 |
| Magic Items | 362 |
| Equipment | 237 |
| Features | 407 |
| Rule Sections | 33 |
| Conditions | 15 |
| Classes / Races / Backgrounds | 12 / 9 / 1 |

## Vincoli tecnici noti

- **`better-sqlite3` è nativo.** Va in `serverExternalPackages` di `next.config.ts` e non va mai
  importato da un Client Component. Su Node 24 i prebuild esistono (verificato); se un domani
  mancassero, serve Xcode Command Line Tools — fallback possibile su `@libsql/client` (puro JS).
- **TypeScript 5.9 e non 7.x.** TS 7 (port nativo in Go) è `latest` su npm ma non ancora validato
  con la pipeline di tipi di Next 16. Vedi `docs/adr/ADR-0002`.
- **ESLint 9 e non 10.** `eslint-plugin-react`, incluso in `eslint-config-next`, usa
  `context.getFilename()`, rimossa in ESLint 10: con la 10 `npm run lint` non parte affatto.
  Vedi `docs/adr/ADR-0006`.
- **Le pagine del pannello DM sono `force-dynamic`.** Senza, Next prerenderebbe l'elenco
  delle campagne al momento della build, congelando i dati. Per un'app locale in cui tutto è
  dato vivo, il rendering dinamico è l'unico corretto.
- **Tailwind 4** usa la configurazione CSS-first (`@theme` in `src/ui/theme.css`): non esiste
  `tailwind.config.js` e non va creato.

# Progress

> ⚡ **Aggiornare a ogni sessione di lavoro, nello stesso commit che tocca `src/`.**
> Risponde a: *cosa funziona davvero, cosa manca, cosa è rotto?*

**Ultimo aggiornamento:** 2026-09-22

## ✅ Funziona

_(Verificato eseguendolo davvero — non solo "compila".)_

- **Scaffold**: `next build` completa senza errori. Font auto-ospitati da `next/font`.
- **`better-sqlite3` su Node 24**: connessione e query verificate a mano, prebuild presenti.
- **Guard rail** — provati uno per uno con violazioni vere, tutti con exit code 1:
  - feature senza spec → R1 blocca ✓
  - `src/core/` che importa `react` → R5 blocca ✓
  - dipendenza senza ADR → R4 blocca ✓
  - repo pulito → exit 0 ✓
- **`core/rules`** — 24 test verdi: modificatori (negativi inclusi), bonus di competenza per livello e
  per GS, punteggi passivi, media dei dadi vita, GS frazionari ⅛/¼/½, tabella dei PE.
- **`core/dice`** — 35 test verdi: notazione completa, vantaggio/svantaggio, tieni/scarta,
  divisore, 20 e 1 naturali (compreso "un 20 scartato non è un critico"), rifiuto degli input non validi.
- **Database** — migrazione `0000_initial` applicata, 12 tabelle create.
- **Importer SRD** — 1729 voci importate e verificate nel database:
  334 mostri · 319 incantesimi · 362 oggetti magici · 237 equipaggiamenti · 407 privilegi ·
  33 sezioni di regole · 15 condizioni · 12 classi · 9 razze · 1 background.
  - **Idempotenza (AC3)**: import eseguito due volte, conteggi invariati ✓
  - **GS frazionari (AC6)**: 0.125→⅛, 0.25→¼, 0.5→½ ✓
  - **Trucchetti (AC10)**: livello 0 → "Trucchetto" ✓
  - **Controllo incrociato col manuale**: Aboleth CA 17 naturale, 135 PF (18d10+36), GS 10, 5900 PE ✓
  - 19 test sul normalizzatore, inclusi i casi limite dei dati SRD
- **CI** — workflow `guardrails` verde al primo push (guard, typecheck, lint, test, build).
- **Repo pubblico** online: https://github.com/ErJump/JumpMaster
- **`npm run build`** — 15 rotte, produzione verde.

### Le 7 slice, provate nel browser

| Slice | Verificato |
|---|---|
| **campagne** | Campagna creata dal form, redirect, **diventata attiva da sola**, persistita nel database |
| **bestiario** | Aboleth confrontato col manuale: CA 17, 135 PF, GS 10, modificatori calcolati (+5/−1/+2/+4/+2/+4). Ricerca «gobl» → 2 di 334, GS frazionari ⅛ ¼ ½ nelle etichette |
| **incantesimi** | Fireball completa: livello 3, Evocation, componenti, «Ai livelli superiori». I trucchetti mostrano "Trucchetto" |
| **oggetti** | 599 voci (362 magici + 237 equipaggiamento) con filtri per rarità e categoria |
| **regole** | 48 voci. **Ricerca bilingue**: «copertura» dà gli stessi 12 risultati di «cover»; «prono» → 8; «riposo» → 6. Tabelle markdown rese correttamente |
| **glossario** | 85 termini, ricerca in entrambe le lingue |
| **dadi** | `4d6kh3` → 5, 5, ~~3~~, 6 = 16. Dado scartato barrato, cronologia, vantaggio disattivato dove non si applica |

## 🔄 In corso

- **M1**: manca la verifica offline reale (Wi-Fi staccato) e la prova a schermo condiviso.

## ⏳ Da fare

- **SPEC-0003 AC17** — provare davvero con il Wi-Fi staccato.
- **AGENTS.md §6** — provare a schermo condiviso su Discord e verificare la leggibilità.
- **SPEC-0002** — AC2, AC5, AC6, AC7 da riprovare a mano con più campagne.
- Il resto: vedi la tabella delle milestone in `active-context.md`.

## 🐛 Problemi noti

- Nessuno aperto.

### Risolti

- `crFromLabel('')` restituiva `0` invece di `null`, perché `Number('')` vale `0`.
  Trovato da un test sui casi limite prima che arrivasse in una feature. Ora coperto.
- `roll.ts` usava `require()` dentro un modulo ESM: sostituito con un import statico.
- `npm run lint` non partiva con ESLint 10 (`eslint-plugin-react` usa un'API rimossa).
  Risolto fissando ESLint 9.39.5 e passando ai flat config nativi di `eslint-config-next`,
  il che ha eliminato anche la dipendenza `@eslint/eslintrc`. Vedi ADR-0006.
- `typedRoutes` produceva una dozzina di errori su ogni link dinamico. Disattivato (ADR-0007).
- **La ricerca italiana non trovava nulla**: l'interfaccia è italiana ma i dati SRD sono
  inglesi, quindi «copertura» dava zero risultati. Scoperto **provando l'app**, non
  progettandola. Risolto con `expandQuery`, che traduce la ricerca col glossario prima di
  filtrare. Espandere può solo aggiungere risultati, mai toglierne.
- `ThemeToggle` chiamava `setState` dentro un effetto (errore di lint React 19). Riscritto
  senza stato React: il tema vive in `data-theme` e il CSS decide quale glifo mostrare.
- Le sezioni SRD ripetevano il titolo come primo heading. Risolto con `stripLeadingHeading`.

## 📌 Debito tecnico accettato

| Voce | Perché | Quando sistemarlo |
|---|---|---|
| TypeScript 5.9 invece di 7.x | TS 7 non ancora validato con Next 16 | Quando Next dichiara il supporto (ADR-0002) |
| Ricerca lato client invece che FTS5 | Su queste quantità è istantaneo e non richiede viaggi al server | Se il contenuto cresce con Open5e (M6) |
| ~190 KB di testo regole spediti al client | Serve per la ricerca a pieno testo; su localhost non si nota | Se l'app venisse ospitata in rete |
| Parser markdown scritto a mano | Il sottoinsieme SRD è chiuso e noto; evita un albero di dipendenze | Se servisse markdown completo |
| Attacchi degli stat block non ancora cliccabili | Il motore dei dadi è pronto, ma è materia di M2 | M2, col combat tracker |
| Analisi degli import via regex nel guard | Zero dipendenze per proteggere 2 invarianti semplici | Se compaiono falsi negativi → `ts-morph` + ADR |
| Solo 1 background e 9 razze | È tutto ciò che contiene l'SRD | M6, con Open5e |
| Nessun import da D&D Beyond | Zona grigia ToS | Import/export JSON generico in M6 |

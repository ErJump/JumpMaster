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

## 🔄 In corso

- **M0**: mancano le primitive `src/ui/`, il registro delle feature, il layout e la home
- **M1**: importer SRD, migrazioni, le 7 slice del compendio

## ⏳ Da fare

Vedi la tabella delle milestone in `active-context.md`.

## 🐛 Problemi noti

- Nessuno aperto.

### Risolti

- `crFromLabel('')` restituiva `0` invece di `null`, perché `Number('')` vale `0`.
  Trovato da un test sui casi limite prima che arrivasse in una feature. Ora coperto.
- `roll.ts` usava `require()` dentro un modulo ESM: sostituito con un import statico.
- `npm run lint` non partiva con ESLint 10 (`eslint-plugin-react` usa un'API rimossa).
  Risolto fissando ESLint 9.39.5 e passando ai flat config nativi di `eslint-config-next`,
  il che ha eliminato anche la dipendenza `@eslint/eslintrc`. Vedi ADR-0006.

## 📌 Debito tecnico accettato

| Voce | Perché | Quando sistemarlo |
|---|---|---|
| TypeScript 5.9 invece di 7.x | TS 7 non ancora validato con Next 16 | Quando Next dichiara il supporto (ADR-0002) |
| Ricerca con `LIKE` invece di FTS5 | Su 334 mostri è già istantaneo | Se il contenuto cresce con Open5e (M6) |
| Analisi degli import via regex nel guard | Zero dipendenze per proteggere 2 invarianti semplici | Se compaiono falsi negativi → `ts-morph` + ADR |
| Solo 1 background e 9 razze | È tutto ciò che contiene l'SRD | M6, con Open5e |
| Nessun import da D&D Beyond | Zona grigia ToS | Import/export JSON generico in M6 |

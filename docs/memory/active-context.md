# Active Context

> ⚡ **Aggiornare a ogni sessione di lavoro, nello stesso commit che tocca `src/`.**
> Risponde a: *su cosa stavamo lavorando e qual è il prossimo passo?*

**Ultimo aggiornamento:** 2026-09-22

## Su cosa si sta lavorando

**M0 — Fondamenta** (quasi completa) e **M1 — Compendio** (fondamenta tecniche pronte).

## Stato

- ✅ Scaffold Next 16 + React 19 + TS strict + Tailwind 4 + Drizzle + SQLite; `next build` verde
- ✅ `AGENTS.md`, `CLAUDE.md`, memory bank (7 file), ADR 0001–0005, 4 spec registrate
- ✅ **Guard rail funzionanti e verificati**: R0–R5, hook `pre-commit`, workflow CI
- ✅ Design system fantasy (`src/ui/theme.css`): due palette, font, fregi
- ✅ Schema DB: tabelle `srd_*` + `campaigns` + `app_settings`
- ✅ `core/rules` (caratteristiche, competenza, GS/PE) — 24 test
- ✅ `core/dice` (parser + motore + resa) — 35 test
- ✅ Migrazione `0000_initial` applicata: 12 tabelle
- ✅ **Importer SRD completo e verificato**: 1729 voci nel database, idempotente
- ✅ CI verde al primo push · repo pubblico online
- 🔄 Primitive `src/ui/`, registro delle feature, layout, le 7 slice del compendio

## Prossimo passo

1. Primitive `src/ui/` (Card, Button, Input, SearchableList, Badge, EmptyState, StatBlock)
2. Registro delle feature + layout con navigazione generata
3. Le 7 slice: `campaigns`, `bestiary`, `spells`, `items`, `rules`, `glossary`, `dice`
4. Verifica offline reale (Wi-Fi staccato) e prova a schermo condiviso

## Decisioni recenti da ricordare

- Regolamento **2014** (SRD 5.1), non 2024.
- UI in italiano, **dati di gioco in inglese** + glossario IT↔EN.
- Web app locale nel browser (PWA-installabile), non app desktop. Tauri resta in M6.
- TypeScript 5.9 e non 7.x — vedi `docs/adr/ADR-0002`.
- `better-sqlite3` **verificato funzionante** su Node 24: nessun fallback a libsql necessario.

## Trappole note

- Non importare `better-sqlite3` da un Client Component (`src/db/client.ts` usa `server-only`).
- Tailwind 4 non ha `tailwind.config.js`: il tema sta in `src/ui/theme.css` sotto `@theme inline`.
- `Number('')` vale `0`, non `NaN` — già inciampati in `crFromLabel`, ora coperto da test.
- Next 16 riscrive `tsconfig.json` al primo build (`jsx: react-jsx`, include dei tipi generati).
- **ESLint 10 non funziona** con `eslint-config-next` 16: fissato a 9.39.5 (ADR-0006).
- La CA dei mostri è un **array**: 7 mostri su 334 hanno una seconda voce condizionale.
  Si prende la prima come principale, l'array completo resta in `data`.

## Milestone

| # | Nome | Stato |
|---|---|---|
| M0 | Fondamenta | 🔄 quasi completa |
| M1 | Compendio (SRD, campagne, regole, dadi) | 🔄 in corso |
| M2 | Il Tavolo (party, encounter builder, combat tracker) | ⏳ |
| M3 | Vista Giocatori (SSE, Discord) | ⏳ |
| M4 | Narrativa (note, prep Lazy DM, generatori) | ⏳ |
| M5 | Mappe (battlemap, fog of war) | ⏳ |
| M6 | Integrazioni (Open5e, audio, Tauri) | ⏳ |

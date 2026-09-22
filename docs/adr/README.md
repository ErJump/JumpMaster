# Architecture Decision Records

Una decisione per file, numerate progressivamente: `ADR-NNNN-<slug>.md`.

**Regola vincolante** (`AGENTS.md` §2.3): ogni dipendenza in `package.json` deve essere nominata in
almeno un ADR. `npm run guard` lo verifica. Le dipendenze sono debito a lungo termine: se non vale un
file da dieci righe, non vale l'installazione.

## Formato

```markdown
# ADR-NNNN — Titolo
- **Stato:** proposed | accepted | superseded by ADR-MMMM
- **Data:** AAAA-MM-GG

## Contesto      → qual era il problema
## Decisione     → cosa abbiamo scelto (elenca i pacchetti!)
## Conseguenze   → cosa guadagniamo e cosa paghiamo
## Alternative   → cosa abbiamo scartato e perché
```

## Indice

| ADR | Titolo | Stato |
|---|---|---|
| [0001](./ADR-0001-stack-locale-next-sqlite.md) | Stack locale: Next.js + SQLite | accepted |
| [0002](./ADR-0002-typescript-5-non-7.md) | TypeScript 5.9 invece di 7.x | accepted |
| [0003](./ADR-0003-fonte-dati-srd.md) | Fonte dati SRD bundlata offline | accepted |
| [0004](./ADR-0004-architettura-feature-slice.md) | Architettura a feature slice | accepted |
| [0005](./ADR-0005-combat-tracker-event-sourced.md) | Combat tracker event-sourced | accepted |
| [0006](./ADR-0006-eslint-9-non-10.md) | ESLint 9 invece di 10 | accepted |

# ADR-0004 — Architettura a feature slice

- **Stato:** accepted
- **Data:** 2026-09-22

## Contesto

Il requisito non funzionale numero uno è la **scalabilità di funzionalità**: la roadmap prevede
combat tracker, vista giocatori, note wiki, generatori, mappe, audio, integrazioni esterne. Un
progetto organizzato per *tipo tecnico* (`components/`, `hooks/`, `services/`, `utils/`) diventa
ingestibile quando le feature si moltiplicano: ogni aggiunta tocca cartelle sparse e i confini
evaporano.

## Decisione

Organizzare il codice in **slice verticali**: `src/features/<nome>/`, ciascuna autosufficiente con
`feature.config.ts`, `components/`, `queries.ts`, `actions.ts`, `schema.ts`, `types.ts`.

Il codice davvero condiviso vive in due soli posti:
- `src/core/` — logica pura (regole, dadi, eventi), senza React né DB;
- `src/ui/` — design system.

Un registro (`src/features/registry.ts`) raccoglie i `feature.config.ts` e genera la navigazione.

**Aggiungere una feature = creare una cartella + una riga nel registry.**

## Conseguenze

**Guadagniamo**
- Il costo di aggiungere la ventesima feature è uguale a quello della seconda.
- Ogni slice si legge, si testa e si rimuove in isolamento.
- I confini sono verificabili: `src/features/A` non importa da `src/features/B` (invariante I2).

**Paghiamo**
- Un po' di duplicazione iniziale fra slice, accettata di proposito: si estrae in `core/`/`ui/`
  solo quando il pattern si ripete davvero, non al primo sospetto.
- Serve disciplina sugli invarianti. Se ti accorgi di dover toccare molti file fuori dalla feature,
  è il segnale di fermarsi e scrivere un ADR (vedi `AGENTS.md` §3).

## Alternative scartate

- **Organizzazione per tipo tecnico** — il fallimento classico su progetti che crescono.
- **Monorepo con pacchetti separati per feature** — il livello di isolamento non serve a un'app che
  gira su un PC solo, e il costo di gestione sarebbe sproporzionato.

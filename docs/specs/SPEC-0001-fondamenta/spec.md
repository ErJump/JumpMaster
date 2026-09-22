---
id: SPEC-0001
slug: fondamenta
title: Fondamenta del workspace
milestone: M0
status: done
updated: 2026-09-22
---

# SPEC-0001 — Fondamenta del workspace

## Perché

Prima di scrivere una sola feature serve l'impalcatura che permette al progetto di crescere per anni
senza degradare: struttura del codice, processo documentale e **guard rail che facciano rispettare il
processo anche quando si ha fretta**.

Il rischio da neutralizzare è concreto: un `AGENTS.md` che *dice* "aggiorna il memory bank" viene
ignorato al terzo commit. La documentazione va tenuta in vita da qualcosa che fallisce, non da una
buona intenzione.

## Cosa

1. Repo Git pubblico `ErJump/JumpMaster`, licenza MIT, `NOTICE` con l'attribuzione SRD.
2. Scaffold Next.js 16 + TypeScript strict + Tailwind 4 + Drizzle + SQLite.
3. `AGENTS.md` e `CLAUDE.md`.
4. Memory bank in `docs/memory/` (7 file).
5. Registro spec in `docs/specs/index.json` e ADR in `docs/adr/`.
6. `scripts/guard.mjs` + hook `pre-commit` + workflow CI.
7. Design system fantasy in `src/ui/` e registro delle feature.

## Criteri di accettazione

- [x] **AC1** — `npm run dev` serve l'app su `http://localhost:3000` senza errori in console.
- [x] **AC2** — `npm run guard` passa su un repo pulito e stampa l'elenco delle regole verificate.
- [x] **AC3** — Creando `src/features/finta/` senza spec, `npm run guard` **fallisce** con exit code 1
      e indica come sistemare. (Verifica che il guard morda davvero.)
- [x] **AC4** — Un commit che tocca `src/` senza aggiornare `active-context.md` e `progress.md` viene
      **bloccato** dall'hook `pre-commit`.
- [x] **AC5** — Aggiungendo una dipendenza non citata in nessun ADR, `npm run guard` fallisce.
- [x] **AC6** — Un file in `src/core/` che importa `react` fa fallire il guard (invariante I1).
- [x] **AC7** — `npm run typecheck` e `npm run lint` passano.
- [x] **AC8** — Il workflow `guardrails` è verde su GitHub.
- [x] **AC9** — Il repo è pubblico e il README contiene l'attribuzione SRD richiesta da CC-BY-4.0.
- [x] **AC10** — Il tema fantasy è applicato, con tema scuro di default e contrasto ≥ 4.5:1.

## Fuori ambito

Qualunque feature di gioco: sono coperte da SPEC-0002 in poi.

## Verifica eseguita — 2026-09-22

Tutti i criteri provati **eseguendo**, non solo compilando:

| AC | Come è stato verificato |
|---|---|
| AC1 | `npm run dev` → home a tema, nessun errore in console |
| AC2 | `npm run guard` verde, elenca le 6 regole |
| AC3 | Creata `src/features/finta/` senza spec → R1 fallisce, exit 1 |
| AC4 | Commit su `src/` senza memory bank → **bloccato dall'hook**, commit non avvenuto |
| AC5 | Aggiunta `left-pad` senza ADR → R4 fallisce, exit 1 |
| AC6 | `src/core/prova/bad.ts` che importa `react` → R5 fallisce, exit 1 |
| AC7 | `npm run typecheck` e `npm run lint` puliti |
| AC8 | Workflow `guardrails` verde su GitHub |
| AC9 | `ErJump/JumpMaster` pubblico, README e NOTICE con l'attribuzione SRD |
| AC10 | Tema scuro di default; rapporti di contrasto annotati in `src/ui/theme.css` |

---
id: SPEC-0001
slug: fondamenta
title: Fondamenta del workspace
milestone: M0
status: in-progress
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

- [ ] **AC1** — `npm run dev` serve l'app su `http://localhost:3000` senza errori in console.
- [ ] **AC2** — `npm run guard` passa su un repo pulito e stampa l'elenco delle regole verificate.
- [ ] **AC3** — Creando `src/features/finta/` senza spec, `npm run guard` **fallisce** con exit code 1
      e indica come sistemare. (Verifica che il guard morda davvero.)
- [ ] **AC4** — Un commit che tocca `src/` senza aggiornare `active-context.md` e `progress.md` viene
      **bloccato** dall'hook `pre-commit`.
- [ ] **AC5** — Aggiungendo una dipendenza non citata in nessun ADR, `npm run guard` fallisce.
- [ ] **AC6** — Un file in `src/core/` che importa `react` fa fallire il guard (invariante I1).
- [ ] **AC7** — `npm run typecheck` e `npm run lint` passano.
- [ ] **AC8** — Il workflow `guardrails` è verde su GitHub.
- [ ] **AC9** — Il repo è pubblico e il README contiene l'attribuzione SRD richiesta da CC-BY-4.0.
- [ ] **AC10** — Il tema fantasy è applicato, con tema scuro di default e contrasto ≥ 4.5:1.

## Fuori ambito

Qualunque feature di gioco: sono coperte da SPEC-0002 in poi.

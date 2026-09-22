# SPEC-0001 — Tasks

## Repo e scaffold
- [x] `git init`, struttura delle cartelle
- [x] `package.json` con gli script
- [x] Dipendenze installate; `better-sqlite3` verificato su Node 24
- [x] `tsconfig.json` strict + `noUncheckedIndexedAccess`
- [x] `next.config.ts` con `serverExternalPackages: ['better-sqlite3']`
- [x] `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `drizzle.config.ts`
- [x] `.gitignore` (con `data/` escluso: campagne private su repo pubblico)

## Documentazione e processo
- [x] `AGENTS.md`
- [x] `CLAUDE.md`
- [x] Memory bank (7 file)
- [x] ADR 0001–0005
- [x] `docs/specs/index.json` e le prime 4 spec

## Guard rail
- [x] `scripts/guard.mjs` (R0–R5)
- [x] `scripts/install-hooks.mjs` + `.githooks/pre-commit`
- [ ] `.github/workflows/guardrails.yml`
- [ ] Template di PR
- [ ] **Verificare che il guard fallisca davvero** (AC3, AC4, AC5, AC6)

## Design system
- [ ] `src/ui/theme.css` con i token delle due palette
- [ ] Font via `next/font`
- [ ] Primitive: Card, Button, Input, SearchableList, Badge, EmptyState
- [ ] Layout dell'app con navigazione generata dal registro
- [ ] Home page

## Repo pubblico
- [ ] `LICENSE` (MIT), `NOTICE` (attribuzione SRD), `README.md`
- [ ] Repo pubblico `ErJump/JumpMaster` creato e primo push
- [ ] CI verde

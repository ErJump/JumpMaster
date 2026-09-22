# AGENTS.md — Contratto operativo per gli agenti su JumpMaster

> Questo file è **vincolante**. Vale per Claude Code, Cursor, Copilot, Codex e qualunque altro agente
> che scriva codice in questo repo. Se un'istruzione dell'utente contraddice questo file, segnalalo
> prima di procedere: potrebbe essere una svista o potrebbe essere una decisione consapevole, ma non
> va mai ignorata in silenzio.
>
> **Le regole qui sotto non sono consigli: `npm run guard` le verifica e fa fallire commit e CI.**

---

## 1. Cos'è JumpMaster

App companion per **Dungeon Master di D&D 5e (regolamento 2014, SRD 5.1)**, in italiano, che gira in
locale sul PC del DM. Serve **durante** la sessione, non solo come archivio.

**L'utente è un DM alle prime armi.** Questo è il vincolo di progetto più importante e va tenuto a
mente a ogni scelta: se una feature richiede di conoscere bene le regole per essere usata, la feature
è progettata male. L'app deve fare i conti al posto suo, spiegare i termini e non lasciarlo bloccato
davanti ai giocatori.

**Contesto d'uso reale:** partite in presenza e partite online con lo schermo condiviso su Discord.

---

## 2. Il ciclo obbligatorio — Spec Driven Development

Nessun codice di feature entra in `main` senza aver attraversato questo ciclo, **in quest'ordine**:

```
1. SPEC      docs/specs/SPEC-NNNN-<slug>/spec.md      →  COSA e PERCHÉ, criteri di accettazione
2. DESIGN    docs/specs/SPEC-NNNN-<slug>/design.md    →  COME: schema dati, moduli, contratti
3. TASKS     docs/specs/SPEC-NNNN-<slug>/tasks.md     →  checklist eseguibile, spuntata via via
4. CODICE    src/…                                     →  implementazione + test
5. MEMORY    docs/memory/active-context.md + progress.md  →  SEMPRE, nello stesso commit
```

### Regole non negoziabili

1. **Ogni cartella in `src/features/<nome>/` deve avere una spec registrata** in `docs/specs/index.json`.
   Creare una feature senza spec fa fallire il guard.
2. **Ogni commit che tocca `src/` deve aggiornare** `docs/memory/active-context.md` **e**
   `docs/memory/progress.md`. Non è burocrazia: è il modo in cui la sessione successiva (umana o
   agente) capisce dove eravamo rimasti senza rileggere tutto il codice.
3. **Ogni nuova dipendenza in `package.json` richiede un ADR** in `docs/adr/`. Le dipendenze sono
   debito a lungo termine: se non vale un file da dieci righe, non vale l'installazione.
4. **Una spec `status: draft` non può avere codice in `main`.** Prima decidi, poi scrivi.
5. **La logica di regole D&D sta in `src/core/rules/` e ha test unitari.** Mai matematica di gioco
   dentro un componente React. Vedi §5.

### Se l'utente chiede una feature "al volo"

Non saltare il ciclo. Scrivi la spec (anche breve, 15 righe bastano), falla vedere, poi implementa.
Una spec di 15 righe scritta prima vale più di 200 righe di codice da buttare.

---

## 3. Struttura del workspace

```
AGENTS.md                    ← questo file
CLAUDE.md                    ← rimanda qui
docs/
  memory/                    ← MEMORY BANK: leggi SEMPRE prima di lavorare
    project-brief.md         ·  perché esiste il progetto          (raramente cambia)
    product-context.md       ·  utenti, obiettivi UX, non-obiettivi (raramente cambia)
    architecture.md          ·  struttura, pattern, invarianti      (cambia con le ADR)
    tech-context.md          ·  stack, versioni, setup              (cambia con le dipendenze)
    active-context.md        ·  ⚡ SU COSA SI LAVORA ORA            (ogni sessione)
    progress.md              ·  ⚡ cosa funziona / cosa manca       (ogni sessione)
    glossary-dnd.md          ·  glossario IT↔EN dei termini di gioco
  specs/
    index.json               ·  registro: feature ↔ spec
    SPEC-NNNN-<slug>/        ·  spec.md · design.md · tasks.md
  adr/
    ADR-NNNN-<slug>.md       ·  una decisione architetturale per file
src/
  app/                       ← SOLO routing e layout. Zero logica di dominio.
    (dm)/                    ·  pannello di controllo del DM
    player/                  ·  Vista Giocatori (finestra condivisa su Discord)
    api/                     ·  route handlers (SSE, ecc.)
  features/<nome>/           ← una feature = una cartella autosufficiente
    feature.config.ts        ·  metadati + voce di navigazione (registrata in src/features/registry.ts)
    components/              ·  React, solo presentazione + interazione
    queries.ts               ·  letture dal DB
    actions.ts               ·  scritture ("use server")
    schema.ts                ·  validazione Zod degli input
    types.ts
  core/                      ← logica pura: zero React, zero DB, 100% testabile
    rules/                   ·  matematica 5e (modificatori, competenza, XP/CR, iniziativa, morte)
    dice/                    ·  parser e motore della notazione dei dadi
    events/                  ·  event log del combattimento (append-only → undo, replay, recap)
  db/
    schema/                  ·  Drizzle: srd.ts (sola lettura) + le tabelle di dominio
    migrations/              ·  generate, MAI scritte a mano
    client.ts
  content/srd/               ← importer SRD → SQLite
  ui/                        ← design system fantasy (primitive riusabili)
  lib/                       ← utility generiche
scripts/guard.mjs            ← implementa le regole di questo file
data/jumpmaster.db           ← il database dell'utente. In .gitignore, MAI committato.
```

### Aggiungere una feature = creare una cartella

È il requisito di scalabilità numero uno. Una nuova feature **non deve mai** richiedere di toccare
dieci file sparsi. Il flusso corretto è:

1. `docs/specs/SPEC-NNNN-<slug>/` + riga in `docs/specs/index.json`
2. `src/features/<nome>/` con il suo `feature.config.ts`
3. registrazione in `src/features/registry.ts` (una riga)
4. la rotta in `src/app/(dm)/<nome>/page.tsx` che importa dalla feature

Se ti accorgi che servirebbe modificare molti file al di fuori della feature, **fermati**: è un
sintomo che l'architettura va discussa. Scrivi un ADR invece di forzare.

---

## 4. Confini architetturali (invarianti)

Questi confini sono la ragione per cui l'app resta gestibile mentre cresce. Violarli è un bug.

| Regola | Perché |
|---|---|
| `src/core/**` non importa **nulla** da React, Next, Drizzle o `src/features` | Deve restare puro e testabile in isolamento |
| `src/features/A` non importa da `src/features/B` | Se serve condivisione → sale in `src/core` o `src/ui` |
| `src/app/**` non contiene logica di dominio | È solo routing e composizione |
| `better-sqlite3` si importa **solo** lato server | È un modulo nativo: rompe il bundle client |
| Le tabelle `srd_*` sono **in sola lettura** a runtime | Si rigenerano con `npm run srd:import`. I dati dell'utente non si mescolano mai con quelli dell'SRD |
| Ogni tabella di dominio ha `campaign_id` | Isolamento fra campagne senza logica speciale |

---

## 5. Regole di dominio D&D

- **Fonte dati**: SRD 5.1 (regolamento 2014) da [`5e-bits/5e-database`](https://github.com/5e-bits/5e-database).
  Dati di gioco **in inglese**, interfaccia **in italiano**, glossario IT↔EN in `docs/memory/glossary-dnd.md`.
- **Attribuzione obbligatoria**: il file `NOTICE` va mantenuto e l'attribuzione SRD resta visibile
  nell'app. È una condizione della licenza CC-BY-4.0, non un dettaglio.
- **Niente contenuti non-SRD nel repo.** Nessun testo dai manuali PHB/MM/DMG. Se serve contenuto in
  più si aggiunge Open5e (fonti open), non copia-incolla dai manuali.
- **L'app funziona offline.** Nessuna feature del tavolo può dipendere dalla rete: se salta il Wi-Fi
  a metà sessione, il combattimento deve continuare. Le chiamate di rete sono ammesse solo in fase
  di import esplicito.
- **La matematica di gioco va testata.** Budget XP, gradi di sfida frazionari (⅛, ¼, ½), bonus di
  competenza, vantaggio/svantaggio: un errore qui rovina una serata. Ogni funzione in
  `src/core/rules/` ha test con casi limite.

---

## 6. UX e estetica — requisito primario, non cosmesi

- **Fantasy, ma leggibile.** Pergamena, oro brunito, capilettera, stat block in stile Monster Manual.
- **⚠️ Vincolo Discord**: lo schermo viene condiviso e la compressione video di Discord distrugge il
  testo sottile su fondo decorato. Regole obbligatorie:
  - contrasto **≥ 4.5:1**, sempre;
  - **nessun testo di corpo sotto 16px**;
  - niente font light su texture;
  - la **Vista Giocatori** usa una scala tipografica più grande del pannello DM.
- **Tema scuro di default** ("notte in taverna"): è più riposante in sessione e regge meglio su Discord.
- **Al tavolo si va di fretta.** Le azioni frequenti (infliggere danno, passare turno, tirare un dado)
  devono essere raggiungibili in **un clic** e avere una scorciatoia da tastiera.
- **Tutto ciò che è distruttivo deve essere annullabile.** Il DM sbaglia in diretta davanti a quattro
  persone: l'undo non è un lusso.
- **L'interfaccia è in italiano.** I dati di gioco restano in inglese (sono quelli dell'SRD) ma ogni
  termine di gioco mostrato deve poter essere spiegato tramite il glossario.

---

## 7. Definition of Done

Una feature è "fatta" solo quando **tutte** queste caselle sono spuntate:

- [ ] La spec esiste, ha `status: done` e i criteri di accettazione sono verificati uno per uno
- [ ] `npm run guard` passa
- [ ] `npm run typecheck` passa
- [ ] `npm run lint` passa
- [ ] `npm test` passa, e la logica in `core/` che hai toccato ha test **con casi limite**
- [ ] `docs/memory/active-context.md` e `docs/memory/progress.md` sono aggiornati
- [ ] L'hai **aperta nel browser e provata davvero**, non solo compilata
- [ ] Funziona **offline** (se è una feature del tavolo)
- [ ] È leggibile a schermo condiviso (vedi §6)

---

## 8. Convenzioni di codice

- **TypeScript strict**, `noUncheckedIndexedAccess` attivo. Niente `any`: se un tipo è ignoto usa
  `unknown` e restringilo con Zod.
- **Validazione al confine**: ogni input che arriva dall'esterno (form, URL, JSON importato) passa da
  uno schema Zod in `schema.ts`. Dentro il confine i tipi sono garantiti.
- **Server Components di default.** `"use client"` solo dove serve davvero interattività, e il più in
  basso possibile nell'albero.
- **Le mutazioni sono Server Actions** in `actions.ts`, non route API, salvo casi che richiedono
  streaming (SSE).
- **Commenti**: spiegano il *perché*, mai il *cosa*. Una regola di D&D non ovvia va commentata con il
  riferimento (es. `// SRD 5.1, "Ability Checks"`).
- **Nomi**: codice e identificatori in inglese, testo rivolto all'utente in italiano, sempre.
- **Migrazioni**: generate con `npm run db:generate`. Non modificare mai un file in
  `src/db/migrations/` a mano. Si **applicano da sole** all'avvio (`src/db/client.ts`): è una
  scelta deliberata per un'app locale il cui utente non è uno sviluppatore.

---

## 9. Comandi

```bash
npm run dev          # avvia l'app su http://localhost:3000
npm run setup        # migrazioni + import dei dati SRD (da lanciare al primo avvio)
npm run guard        # ⚡ verifica i guard rail di questo file
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # Vitest (unitari)
npm run e2e          # Playwright (end-to-end)
npm run srd:fetch    # riscarica i JSON dell'SRD (richiede rete)
npm run srd:import   # popola le tabelle srd_* nel database
npm run db:generate  # genera una migrazione dallo schema Drizzle
```

---

## 10. Cosa NON fare

- ❌ Committare `data/jumpmaster.db` — contiene le campagne dell'utente, il repo è pubblico
- ❌ Scrivere contenuto protetto dai manuali D&D (solo SRD e fonti open)
- ❌ Saltare il ciclo spec-driven "perché è una modifica piccola"
- ❌ Aggiornare il memory bank "dopo", in un commit separato — deve stare nello stesso commit
- ❌ Mettere logica di regole dentro i componenti React
- ❌ Aggiungere dipendenze senza ADR
- ❌ Fare `git push` o aprire PR senza che l'utente lo abbia chiesto

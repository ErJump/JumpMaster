# Active Context

> ⚡ **Aggiornare a ogni sessione di lavoro, nello stesso commit che tocca `src/`.**
> Risponde a: *su cosa stavamo lavorando e qual è il prossimo passo?*

**Ultimo aggiornamento:** 2026-09-22

## Su cosa si sta lavorando

**M0 — Fondamenta: completa** (SPEC-0001 chiusa).
**M1 — Compendio: funzionante e offline** (SPEC-0003 chiusa); SPEC-0002 e SPEC-0004 hanno
ancora qualche criterio da provare con clic veri.

## Stato

- ✅ Scaffold, guard rail, CI, memory bank, 7 ADR, 4 spec
- ✅ `core/rules` e `core/dice` — moduli puri, 66 test
- ✅ Importer SRD: 1729 voci, idempotente
- ✅ Design system fantasy: due palette, Cinzel + EB Garamond, stat block stile Monster Manual
- ✅ Registro delle feature → navigazione generata
- ✅ **7 slice complete e provate nel browser**: campagne, bestiario, incantesimi, oggetti,
  regole, glossario, dadi
- ✅ `npm run build` verde: 15 rotte
- ✅ **Offline confermato**: 21 richieste, tutte a localhost, zero host esterni
- ✅ **Hook `pre-commit` provato**: blocca davvero un commit senza memory bank aggiornato
- ✅ **Prova da clone fresco**: build verde con database inesistente, 13 tabelle create da sole
- ⏳ Prova a schermo condiviso su Discord — la sola cosa che deve fare Giampiero

## Prossimo passo

1. **Prova su Discord** a schermo condiviso (AGENTS.md §6) — serve Giampiero
2. Chiudere SPEC-0002 e SPEC-0004 provando a mano i criteri rimasti
3. Aprire **M2 — Il Tavolo**: SPEC per PG e PNG, Party Dashboard, Encounter Builder e
   **Combat Tracker** event-sourced (ADR-0005). Il motore dei dadi è già pronto per rendere
   cliccabili gli attacchi negli stat block.

## Decisioni recenti da ricordare

- Regolamento **2014** (SRD 5.1). UI italiana, dati di gioco in inglese.
- **Ricerca bilingue**: il glossario traduce la ricerca prima di filtrare, così «copertura»
  trova *Cover*. Senza, la ricerca italiana su dati inglesi sarebbe stata inutile — è emerso
  provando l'app, non progettandola.
- L'elenco del compendio vive nel **layout**, non nella pagina: resta montato passando da una
  scheda all'altra, quindi ricerca e filtri non si azzerano.
- Filtraggio **lato client** su metadati leggeri: risposta istantanea, niente viaggi al server.
- `typedRoutes` disattivato (ADR-0007), ESLint 9 (ADR-0006), TypeScript 5.9 (ADR-0002).

## Trappole note

- Non importare `better-sqlite3` da un Client Component (`src/db/client.ts` usa `server-only`).
- Le pagine che leggono il database vanno **`force-dynamic`**, altrimenti Next le prerenderizza
  e i dati restano congelati al momento della build.
- Prima di dare per buona una modifica: provarla anche **da copia appena clonata**
  (`JUMPMASTER_DB` su un percorso inesistente). Il locale ha sempre il database già pronto.
- Tailwind 4 non ha `tailwind.config.js`: il tema sta in `src/ui/theme.css` sotto `@theme inline`.
- `Number('')` vale `0`, non `NaN` — inciampati in `crFromLabel`, ora coperto da test.
- Niente `setState` dentro `useEffect`: React 19 lo segnala come errore di lint. Per il tema
  si usa `data-theme` + CSS, senza stato React.
- La CA dei mostri è un **array**: 7 mostri su 334 hanno una voce condizionale. Si prende la prima.
- Nel pannello del browser di Claude i click sintetici non raggiungono React: per provare
  l'interattività serve invocare il gestore o usare il setter nativo del valore. **Non è un bug
  dell'app** — verificato che i gestori funzionano.

## Milestone

| # | Nome | Stato |
|---|---|---|
| M0 | Fondamenta | ✅ completa |
| M1 | Compendio (SRD, campagne, regole, dadi) | 🔄 funzionante e offline; restano criteri da provare a mano |
| M2 | Il Tavolo (party, encounter builder, combat tracker) | ⏳ prossima |
| M3 | Vista Giocatori (SSE, Discord) | ⏳ |
| M4 | Narrativa (note, prep Lazy DM, generatori) | ⏳ |
| M5 | Mappe (battlemap, fog of war) | ⏳ |
| M6 | Integrazioni (Open5e, audio, Tauri) | ⏳ |

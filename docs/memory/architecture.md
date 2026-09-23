# Architecture

> Aggiornare quando si aggiunge una ADR o cambia un invariante.

## Il principio guida

Il requisito numero uno è la **scalabilità di funzionalità**. La risposta non è il framework: è la
**struttura a slice verticali**. Aggiungere una feature deve voler dire *creare una cartella e
registrare una voce di menu* — mai toccare quindici file sparsi.

## Strati

```
┌─────────────────────────────────────────────────────────┐
│  src/app/            routing + layout, ZERO dominio      │
├─────────────────────────────────────────────────────────┤
│  src/features/<x>/   slice verticali autosufficienti     │
│                      components · queries · actions      │
├──────────────────────────┬──────────────────────────────┤
│  src/core/               │  src/ui/                      │
│  logica pura, testata    │  design system fantasy        │
│  rules · dice · events   │                               │
├──────────────────────────┴──────────────────────────────┤
│  src/db/  Drizzle + SQLite        src/content/srd/       │
└─────────────────────────────────────────────────────────┘
```

## Invarianti (violarli è un bug — `npm run guard` non li vede tutti, il code review sì)

| # | Invariante | Perché |
|---|---|---|
| I1 | `src/core/**` non importa React, Next, Drizzle né `src/features` | Deve restare puro e testabile in isolamento |
| I2 | `src/features/A` non importa da `src/features/B` | Condivisione → sale in `core/` o `ui/` |
| I3 | `src/app/**` non contiene logica di dominio | È solo composizione |
| I4 | `better-sqlite3` solo lato server | Modulo nativo: rompe il bundle client |
| I5 | Tabelle `srd_*` e `open5e_*` in sola lettura a runtime, scritte solo dal loro import | Rigenerabili; dati utente mai mescolati con quelli di gioco. I mostri si leggono dalla vista `monsters` (ADR-0013) |
| I6 | Ogni tabella di dominio ha `campaign_id` | Isolamento fra campagne senza logica speciale |
| I7 | Una lettura usata da **più slice** sta in `src/db/queries/`, non in una delle slice | È il modo di condividere dati senza violare I2 (es. il registro del combattimento, letto da `combat` e da `player`) |
| I8 | Un file immagine appartiene a **una sola riga** | Eliminare la riga cancella il file: chi copia righe copia anche il file (SPEC-0014) |

Il livello dati condiviso, oltre a `db/queries/`, ha `db/files.ts` (le immagini in `data/uploads/`) e
`db/schema/json.ts` (la forma delle colonne JSON, validata con Zod da chi scrive, da chi legge e
dall'archivio).

## Decisioni portanti

### `core/rules/` separato dalla UI
Le regole di D&D sono matematica, e l'utente non le conosce ancora: devono essere **funzioni pure
con test unitari**, non logica sparsa dentro i componenti. Se l'app sbaglia un budget XP manda in TPK
la festa. È il punto in cui i test servono davvero.

### Combat tracker event-sourced
Ogni azione (danno, cura, condizione, cambio turno) è un **evento append-only** in
`src/core/events/`, non una modifica diretta dello stato. Regala gratuitamente:
- **undo** — fondamentale quando il DM sbaglia in diretta;
- replay del combattimento;
- in futuro, il recap automatico della sessione.

### Due namespace nel database
- `srd_*` → contenuto SRD, sola lettura, rigenerabile con `npm run srd:import`
- tabelle di dominio → dati dell'utente, tutte con `campaign_id`

Nuova campagna = nessuna magia, solo un altro `campaign_id`.

### Sincronizzazione Vista Giocatori
Endpoint **SSE** + tabella `live_state`. Funziona fra due finestre sullo stesso PC e, gratis, anche
verso un tablet in LAN. Scelto invece di WebSocket perché il flusso è unidirezionale (DM → giocatori)
e SSE non richiede infrastruttura aggiuntiva.

## Registro delle feature

`src/features/registry.ts` raccoglie i `feature.config.ts` di ogni slice e genera la navigazione.
Aggiungere una feature alla UI = una riga nel registry.

## ADR

Vedi `docs/adr/`. Una decisione per file, numerate progressivamente.

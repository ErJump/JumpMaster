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
- **Database** — migrazione `0000_initial` applicata, 12 tabelle create.
- **Importer SRD** — 1729 voci importate e verificate nel database:
  334 mostri · 319 incantesimi · 362 oggetti magici · 237 equipaggiamenti · 407 privilegi ·
  33 sezioni di regole · 15 condizioni · 12 classi · 9 razze · 1 background.
  - **Idempotenza (AC3)**: import eseguito due volte, conteggi invariati ✓
  - **GS frazionari (AC6)**: 0.125→⅛, 0.25→¼, 0.5→½ ✓
  - **Trucchetti (AC10)**: livello 0 → "Trucchetto" ✓
  - **Controllo incrociato col manuale**: Aboleth CA 17 naturale, 135 PF (18d10+36), GS 10, 5900 PE ✓
  - 19 test sul normalizzatore, inclusi i casi limite dei dati SRD
- **CI** — workflow `guardrails` verde al primo push (guard, typecheck, lint, test, build).
- **Repo pubblico** online: https://github.com/ErJump/JumpMaster
- **`npm run build`** — 15 rotte, produzione verde.

### Le 7 slice, provate nel browser

| Slice | Verificato |
|---|---|
| **campagne** | Campagna creata dal form, redirect, **diventata attiva da sola**, persistita nel database |
| **bestiario** | Aboleth confrontato col manuale: CA 17, 135 PF, GS 10, modificatori calcolati (+5/−1/+2/+4/+2/+4). Ricerca «gobl» → 2 di 334, GS frazionari ⅛ ¼ ½ nelle etichette |
| **incantesimi** | Fireball completa: livello 3, Evocation, componenti, «Ai livelli superiori». I trucchetti mostrano "Trucchetto" |
| **oggetti** | 599 voci (362 magici + 237 equipaggiamento) con filtri per rarità e categoria |
| **regole** | 48 voci. **Ricerca bilingue**: «copertura» dà gli stessi 12 risultati di «cover»; «prono» → 8; «riposo» → 6. Tabelle markdown rese correttamente |
| **glossario** | 85 termini, ricerca in entrambe le lingue |
| **dadi** | `4d6kh3` → 5, 5, ~~3~~, 6 = 16. Dado scartato barrato, cronologia, vantaggio disattivato dove non si applica |

- **Offline confermato**: una sessione completa produce **21 richieste, tutte a
  `localhost:3000`, zero host esterni**. I font sono auto-ospitati da `next/font`.
  Se salta il Wi-Fi a metà sessione, l'app continua a funzionare.
- **L'hook `pre-commit` blocca davvero**: provato un commit su `src/` senza aggiornare il
  memory bank → rifiutato, commit non avvenuto.

### M4 — Sessioni: preparazione Lazy DM e diario (SPEC-0010, chiusa)

- Gli otto passi, ognuno con la spiegazione di a cosa serve; salvataggio automatico.
- Vista «al tavolo» coi collegamenti cliccabili e i segreti da spuntare durante il gioco.
- **I segreti non scoperti passano da soli alla sessione successiva** — verificato.
- Diario con «Bozza dal registro»: il riassunto dei combattimenti, dalla riduzione degli eventi.
- Cronologia con i contatori dei segreti.

### M4 — Note della campagna (SPEC-0009, chiusa)

- Note con `[[Titolo]]`: verso una nota, verso un personaggio, o «crea questa nota» col titolo già
  scritto. Ogni nota elenca chi la cita. Maiuscole e accenti non contano.
- **Rinomina che riscrive i collegamenti ovunque** (note e sessioni), conservando le etichette.
  Titoli duplicati rifiutati, perché renderebbero ambiguo ogni collegamento.
- Ricerca istantanea anche nel testo.

### M3 — Vista Giocatori (provata a due finestre)

- Finestra separata `/player`, tipografia maggiorata, aggiornata via **SSE senza ricaricare**.
- Avviando un combattimento la Vista passa **da sola** al combattimento (modalità automatica).
- **Stream SSE letto a mano**: nessun PF dei mostri, nessuna CA, nessuno stat block, nessun
  nome dello scontro. Mostri a fasce, PG coi numeri.
- Combattente nascosto → sparisce; il suo turno non evidenzia nessuno.
- Handout con immagine caricata dal PC; SVG travestito da PNG **rifiutato**; ogni percorso
  malevolo verso `/api/uploads` restituisce 404.
- Regia con anteprima dal vivo (la pagina dei giocatori, rimpicciolita), Oscura e Automatica.
- Tiro pubblico sulla Vista, tiro segreto no — chiude anche SPEC-0004 AC8.

### M2 — slice `combat`, il combat tracker (provato giocando)

Combattimento vero: 4 goblin e un ogre contro Elara e Gorm, **sbagliando apposta e annullando**.

- Avvio da uno scontro: PG dentro da soli, goblin numerati con iniziativa già tirata.
- Attacchi **cliccabili** dallo stat block; il danno tirato precompila il campo.
- **Errore voluto** (40 danni invece di 4) → «Annulla (40 danni)» → Gorm torna a 39/44.
- Promemoria di concentrazione con la CD calcolata da sola; caduta a 0, tiri contro morte,
  cura che rimette in piedi e azzera i salvezza.
- **Pagina ricaricata: stato identico al dettaglio.** Nel database 8 eventi di preparazione e
  15 azioni nell'ordine esatto, il danno sbagliato scartato.
- Tre lacune emerse **giocando** e chiuse nel core con test: turno che si fermava sui morti,
  concentrazione mantenuta senza evento, critico che non raddoppiava i dadi.

### M2 — slice `encounters` (provata nel browser)

- Costruttore con ricerca sui 334 mostri e **stima istantanea** della difficoltà, che mostra
  tutti i passaggi e dichiara di essere una stima propria (ADR-0008).
- Verificato contro calcoli fatti a mano prima: 4 goblin → Banale (rapporto 0,36);
  \+ 1 ogre → Impegnativo (1,27). Identici al centesimo.
- Salvataggio automatico a ogni modifica, verificato ricaricando la pagina.

### M2 — slice `characters` (provata nel browser)

- Schede PG con i sei punteggi e le competenze: **tutto il resto lo calcola l'app**. Verificato
  su due personaggi con valori calcolati a mano prima: combaciano tutti.
- **Party Dashboard** `/gruppo`: CA, PF, Percezione passiva e iniziativa a colpo d'occhio, con
  tipografia maggiorata. La Percezione più alta del gruppo in oro — verificato che si **sposti**
  aggiungendo un PG con un punteggio maggiore.
- PNG con segreto riservato e collegamento allo stat block del bestiario.

### M2 — il core

- **`core/rules/character.ts`** — 13 test: modificatori, tiri salvezza, competenza ed
  **esperienza** (che raddoppia, non somma due volte), punteggi passivi, iniziativa,
  e la mappa delle 18 abilità alle caratteristiche giuste.
- **`core/rules/encounter.ts`** — 19 test. Stima **nostra** (ADR-0008) su curva continua
  `n^0.35` invece di una tabella a scalini, così passare da 6 a 7 mostri non fa saltare la
  difficoltà. Verificato l'ancoraggio: un mostro di GS pari al livello risulta «impegnativo»,
  e quattro goblin contro un gruppo di livello 1 risultano «duri», come da fama.
- **`core/events/hit-points.ts`** — 30 test sulle regole SRD, incluse quelle che un DM alle
  prime armi sbaglia: i temporanei **non si sommano**, il danno massiccio uccide all'istante
  (con il confine esatto verificato a ±1), un critico a terra costa **due** fallimenti,
  un 20 naturale rimette in piedi con 1 PF invece di stabilizzare.
- **`core/events/combat-reduce.ts`** — 26 test. Ordinamento **deterministico** (senza, le righe
  salterebbero da sole mentre il DM gioca), turni e round, rimozione durante il giro,
  promemoria di concentrazione con la CD già calcolata, e l'annulla verificato risalendo
  il registro più volte di seguito.

## 🔄 In corso

- **M3**: da provare la riconnessione dopo un riavvio dell'app (AC3).
- **M2**: tutte e tre le slice fatte e provate. Da provare a mano: SPEC-0007 AC2 (PF tirati),
  AC9 (condizioni), AC15 (leggendari); SPEC-0005 AC7/AC8; SPEC-0006 AC6/AC7.
- **M1**: SPEC-0001 e SPEC-0003 chiuse. Restano da provare a mano alcuni criteri di
  SPEC-0002 (elenco, modifica, eliminazione, stato vuoto con più campagne) e di SPEC-0004
  (pulsanti rapidi, interruttori vantaggio, tiro segreto, Invio).

## ⏳ Da fare

- **AGENTS.md §6** — provare a schermo condiviso su Discord e verificare la leggibilità.
  È l'unica cosa che non posso verificare io: serve Giampiero davanti a Discord.
- **SPEC-0002** — AC2, AC5, AC6, AC7 da riprovare a mano con più campagne.
- **SPEC-0004** — AC5, AC6, AC8, AC9 da provare con clic veri.
- Il resto: vedi la tabella delle milestone in `active-context.md`.

## 🐛 Problemi noti

- Nessuno aperto.

### Risolti

- **Titoli ed elenchi non riconosciuti nelle note.** Le textarea inviano `\r\n` e il parser
  divideva solo su `\n`. Emerso salvando la prima nota vera; i testi SRD usano `\n` e lo
  nascondevano. Corretto nel parser, con test di regressione.

- **Race condition nelle migrazioni automatiche** (ADR-0010). La CI di M3 è fallita con «table
  already exists»: i processi paralleli di `next build` migravano tutti insieme. Il difetto c'era
  da settimane e le CI passavano **per fortuna di tempi**; in locale sei build su sei riuscivano.
  Riprodotto forzando la concorrenza (otto processi: 9 round su 10 falliti), corretto con un lock
  fra processi, ribadito con la stessa batteria (0 su 10). Nello stesso giro è emerso che
  `npm run setup` **non funzionava da clone fresco**: l'import richiedeva un database già esistente.

- **La CI è fallita al terzo push** e ha scoperto un bug vero, non un capriccio
  dell'ambiente: `data/` è in `.gitignore`, quindi su una copia appena clonata la cartella
  non esiste e `new Database()` falliva con *"Cannot open database because the directory
  does not exist"*. Chiunque avesse clonato il repo ci sarebbe finito dentro.
  Risolto creando la cartella e **applicando le migrazioni da sole** all'avvio.
- **La build prerenderizzava l'elenco campagne coi dati presenti al momento della compilazione.**
  Emerso indagando lo stesso fallimento. Chi avesse fatto `npm run build && npm start` avrebbe
  visto dati congelati. Risolto con `force-dynamic` sul layout del pannello DM.

- `crFromLabel('')` restituiva `0` invece di `null`, perché `Number('')` vale `0`.
  Trovato da un test sui casi limite prima che arrivasse in una feature. Ora coperto.
- `roll.ts` usava `require()` dentro un modulo ESM: sostituito con un import statico.
- `npm run lint` non partiva con ESLint 10 (`eslint-plugin-react` usa un'API rimossa).
  Risolto fissando ESLint 9.39.5 e passando ai flat config nativi di `eslint-config-next`,
  il che ha eliminato anche la dipendenza `@eslint/eslintrc`. Vedi ADR-0006.
- `typedRoutes` produceva una dozzina di errori su ogni link dinamico. Disattivato (ADR-0007).
- **La ricerca italiana non trovava nulla**: l'interfaccia è italiana ma i dati SRD sono
  inglesi, quindi «copertura» dava zero risultati. Scoperto **provando l'app**, non
  progettandola. Risolto con `expandQuery`, che traduce la ricerca col glossario prima di
  filtrare. Espandere può solo aggiungere risultati, mai toglierne.
- `ThemeToggle` chiamava `setState` dentro un effetto (errore di lint React 19). Riscritto
  senza stato React: il tema vive in `data-theme` e il CSS decide quale glifo mostrare.
- Le sezioni SRD ripetevano il titolo come primo heading. Risolto con `stripLeadingHeading`.

## 📌 Debito tecnico accettato

| Voce | Perché | Quando sistemarlo |
|---|---|---|
| TypeScript 5.9 invece di 7.x | TS 7 non ancora validato con Next 16 | Quando Next dichiara il supporto (ADR-0002) |
| Ricerca lato client invece che FTS5 | Su queste quantità è istantaneo e non richiede viaggi al server | Se il contenuto cresce con Open5e (M6) |
| ~190 KB di testo regole spediti al client | Serve per la ricerca a pieno testo; su localhost non si nota | Se l'app venisse ospitata in rete |
| Parser markdown scritto a mano | Il sottoinsieme SRD è chiuso e noto; evita un albero di dipendenze | Se servisse markdown completo |
| Durante il turno di un nascosto la Vista non evidenzia nessuno | Evidenziare un altro sarebbe falso, mostrarlo lo tradirebbe | Accettato (SPEC-0008) |
| La Vista ricalcola ogni 500 ms per finestra aperta | Robusto e semplice (ADR-0009); su SQLite locale costa microsecondi | Se si ospitasse con molte finestre aperte |
| I PG entrano in combattimento sempre a PF pieni | I PF correnti fuori dal combattimento non si tracciano ancora | Quando servirà la continuità fra scontri |
| Il 20 naturale si registra solo dagli attacchi dello stat block | I PG tirano coi dadi veri: il DM segna «colpo critico» a mano | Se servisse un tiro d'attacco per i PG |
| `campaigns.partyLevel` non più usato | Il livello si deriva dai PG (`partyProfile`) | Rimuoverlo con una migrazione quando si tocca SPEC-0002 |
| Migrazioni applicate automaticamente all'avvio | L'utente è un DM, non uno sviluppatore. Sicure fra processi con un lock (ADR-0010) | — |
| Analisi degli import via regex nel guard | Zero dipendenze per proteggere 2 invarianti semplici | Se compaiono falsi negativi → `ts-morph` + ADR |
| Solo 1 background e 9 razze | È tutto ciò che contiene l'SRD | M6, con Open5e |
| Nessun import da D&D Beyond | Zona grigia ToS | Import/export JSON generico in M6 |

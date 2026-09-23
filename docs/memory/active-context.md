# Active Context

> ⚡ **Aggiornare a ogni sessione di lavoro, nello stesso commit che tocca `src/`.**
> Risponde a: *su cosa stavamo lavorando e qual è il prossimo passo?*

**Ultimo aggiornamento:** 2026-09-23

## Su cosa si sta lavorando

**M5 — Mappe: completa.** Battlemap con griglia, segnalini, righello e nebbia (SPEC-0012) e mappa
del mondo con segnaposto collegati alle note (SPEC-0013), entrambe chiuse. Prossima: **M6 —
Integrazioni** (Open5e, import/export campagna, audio, Tauri) — da scrivere la spec.

**M4 — Narrativa: completa.** Note con collegamenti (SPEC-0009), sessioni Lazy DM col diario
(SPEC-0010) e generatori (SPEC-0011), tutte chiuse.

**M3 — Vista Giocatori: funzionante.** Seconda finestra sincronizzata via SSE, mostri a fasce
senza numeri, combattenti nascosti, handout con immagini, regia del DM, tiri pubblici. Provata
a due finestre affiancate. Resta da provare la riconnessione dopo un riavvio.

M2 funzionante (restano criteri residui da provare a mano) · M1 e M0 completi.

M0 completa (SPEC-0001 chiusa) · M1 funzionante e offline (SPEC-0003 chiusa).

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

1. ✅ Schema M2 + migrazione `0001_m2-tavolo`
2. ✅ Slice `characters` + **Party Dashboard** (SPEC-0005)
3. ✅ Slice `encounters` con il misuratore di difficoltà (SPEC-0006)
4. ✅ Slice `combat` — il combat tracker (SPEC-0007)
5. **Prova su Discord** a schermo condiviso — serve Giampiero
6. Provare a mano i criteri rimasti di SPEC-0005/0006/0007, poi chiuderle
7. ✅ **M3 — Vista Giocatori**
8. **Prova su Discord con la Vista Giocatori** — è il test che conta davvero per M3
9. ✅ **M4 — Narrativa**
10. ✅ **M5 — Mappe**
11. **M6 — Integrazioni**: scegliere con Giampiero da cosa partire (import/export è il più utile
    per non perdere le campagne)

## Decisioni recenti da ricordare

- Regolamento **2014** (SRD 5.1). UI italiana, dati di gioco in inglese.
- **Ricerca bilingue**: il glossario traduce la ricerca prima di filtrare, così «copertura»
  trova *Cover*. Senza, la ricerca italiana su dati inglesi sarebbe stata inutile — è emerso
  provando l'app, non progettandola.
- L'elenco del compendio vive nel **layout**, non nella pagina: resta montato passando da una
  scheda all'altra, quindi ricerca e filtri non si azzerano.
- Filtraggio **lato client** su metadati leggeri: risposta istantanea, niente viaggi al server.
- `typedRoutes` disattivato (ADR-0007), ESLint 9 (ADR-0006), TypeScript 5.9 (ADR-0002).
- **Le tabelle di bilanciamento della Guida del DM non sono nell'SRD** e non esistono in nessuna
  fonte aperta. La stima degli scontri è **nostra**, va dichiarata come tale nell'interfaccia e
  i suoi numeri non combaceranno con quelli del manuale. Vedi ADR-0008.
- I mostri muoiono a 0 PF, i PG tirano i salvezza contro morte: prassi di tavolo, scelta in
  `core/events/hit-points.ts`.
- **Le slice non si importano fra loro (I2)**: le query di `characters` ricevono `campaignId`
  come parametro, ed è la pagina in `app/` a leggere la campagna attiva e passarla.
- La Party Dashboard ha una voce di menu propria (`partyFeature`) ma vive nella slice
  `characters`: è una vista sugli stessi dati, non una feature a sé.
- **Il livello del gruppo si deriva, non si salva**: `partyProfile` lo calcola dai PG. Il campo
  `campaigns.partyLevel` di SPEC-0002 resta ma non è usato dalla stima — candidato a rimozione.
- Gli scontri si salvano **a ogni clic**, senza pulsante «Salva». Il client manda solo
  `{slug, count}`: PE, PF e CA li rilegge il server dall'SRD.
- **Il combattimento si riduce nel browser** (`useCombat`): ogni azione si applica all'istante
  e si salva in una **coda ordinata**. Il database resta la fonte di verità alla ricarica —
  verificato: stato identico dopo il ricaricamento.
- Gli eventi di preparazione sono marcati `setup` nel payload e **non si annullano**:
  annullandoli sparirebbero i combattenti.
- I mostri morti **non hanno turno**; i PG privi di sensi sì (tirano i salvezza contro morte).
- **Vista Giocatori (ADR-0009)**: SSE che ricalcola la vista pubblica ogni 500 ms e la invia solo
  se cambia. Nessun bus in memoria. `buildPlayerView` è l'**unico** punto che decide cosa è
  pubblico, e `PublicCombatant` è un **tipo diverso** da `Combatant`: i campi riservati non
  esistono, non vengono filtrati dopo.
- **Modalità automatica**: la Vista mostra il combattimento se ce n'è uno `running`. Così il
  combat tracker non sa nulla della Vista (I2).
- **Invariante I7**: una lettura usata da più slice sta in `src/db/queries/` (es. il registro del
  combattimento, letto da `combat` e da `player`).
- Il **nome dello scontro** non va mai ai giocatori: è un dato del DM e può essere uno spoiler.
- **Mappe (ADR-0012)**: la nebbia è un velo SVG sopra l'immagine. `toPublicMap` è l'unico punto che
  decide cosa della mappa è pubblico; `PublicMap` è un tipo a sé, senza `combatantId` né `hidden`.
- Una mappa per tutto: `kind: 'battle' | 'world'`. La nebbia si salva come elenco delle caselle
  **rivelate** (`"col,riga"`): una mappa nuova nasce tutta coperta.
- I segnalini si legano ai combattenti per `combatantId`; lo stato (morto, di turno) si legge dal
  combattimento in corso (`runningCombat` in `db/queries/combat-log.ts`), non si copia.
- Le immagini caricate stanno in `src/db/files.ts` (spostato da `features/player`): le usano handout e mappe.

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
- React 19 vieta di scrivere un ref durante il render: per le scorciatoie da tastiera si usa
  `useEffectEvent` (stabile in React 19.3).
- Per provare un 20 naturale nel browser si forza `Math.random = () => 0.999` per un solo tiro.
- I percorsi su disco calcolati a runtime vanno marcati `/* turbopackIgnore: true */`, altrimenti
  la build traccia l'intero progetto. Per le immagini c'è un solo punto: `uploadPath()`.
- Le immagini si validano sui **byte iniziali**, mai su estensione o tipo dichiarato.
- **Le textarea inviano `\r\n`** (standard HTML). Ogni parser di testo scritto dall'utente deve
  normalizzare i ritorni a capo: `parseMarkdown` lo fa.
- **Salvataggio automatico**: `ui/hooks/useAutosave` — ritardo, coda ordinata, salva comunque se
  si cambia pagina, chiede conferma se si chiude con modifiche in attesa. Da riusare ovunque.
- **Generatori**: contenuto originale (ADR-0011), funzioni pure in `core/generators` con `seeded()`
  per i test. **Rileggere sempre gli esempi generati**: i test controllano la logica, non l'italiano.
  Le regole di grammatica (articoli, concordanze) sono fissate come test.
- **Sessioni**: i segreti non rivelati passano alla sessione successiva (`carryOverSecrets`). La
  bozza del diario prende i combattimenti conclusi fra l'inizio di questa sessione e della prossima.
- I collegamenti `[[…]]` **non si salvano**, si ricavano dal testo. Le operazioni che attraversano
  note, sessioni e personaggi (citazioni, rinomina) stanno in `src/db/queries/links.ts` (I7).
- **Il database si apre SOLO con `openDatabase()`** (`src/db/open.ts`): migrazioni sotto un lock
  fra processi (ADR-0010). Mai `new Database()` diretto in un nuovo script.
- **Una prova che passa non esclude una race.** Le build «da clone fresco» passavano sei su sei
  mentre la CI falliva. Quando qualcosa gira in più processi, si verifica **forzando la
  concorrenza** (in scratchpad c'è una batteria di otto processi).
- **Gestori del puntatore e stato vecchio**: durante un trascinamento i gestori leggono lo stato del
  render precedente. Il valore definitivo si calcola dall'**evento di rilascio**, lo stato vivo sta
  in un ref (`latest` in `MapEditor`). Il sintomo fu un righello a 0 ft.
- **Ogni canale verso i giocatori può tradire.** Nascondere il segnalino non bastava: il nome
  passava dalla riga del turno. Quando si nasconde qualcosa, cercarlo in **tutto** il JSON inviato.
- Danno massiccio: 99 danni su un PG da 20 PF è morte istantanea (SRD). Nei test, per un PG
  «a terra» usare un avanzo sotto i PF massimi.
- Nel pannello del browser di Claude i click sintetici non raggiungono React: per provare
  l'interattività serve invocare il gestore o usare il setter nativo del valore. **Non è un bug
  dell'app** — verificato che i gestori funzionano.

## Milestone

| # | Nome | Stato |
|---|---|---|
| M0 | Fondamenta | ✅ completa |
| M1 | Compendio (SRD, campagne, regole, dadi) | 🔄 funzionante e offline; restano criteri da provare a mano |
| M2 | Il Tavolo (party, encounter builder, combat tracker) | 🔄 funzionante, criteri residui da provare |
| M3 | Vista Giocatori (SSE, Discord) | ✅ funzionante, manca la prova di riconnessione |
| M4 | Narrativa (note, prep Lazy DM, generatori) | ✅ completa |
| M5 | Mappe (battlemap, fog of war, mondo) | ✅ completa |
| M6 | Integrazioni (Open5e, audio, Tauri) | ⏳ |

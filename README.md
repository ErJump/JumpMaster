<div align="center">

# ⚔ JumpMaster

**Il compagno di avventure del Dungeon Master.**

App companion per D&D 5e (regolamento 2014) che gira in locale, in italiano,
pensata per assisterti **durante** la sessione — non solo per archiviare schede.

</div>

---

## Perché esiste

Condurre una partita da novizio significa tenere insieme, in tempo reale e davanti a quattro persone
che aspettano: l'iniziativa, i punti ferita di sei mostri, chi è in concentrazione, una regola che non
ricordi, il filo della trama e l'improvvisazione quando il gruppo va fuori copione.

JumpMaster **fa i conti al posto tuo** e cerca di non lasciarti mai bloccato.
Il principio guida del progetto: *se una feature richiede di conoscere bene le regole per essere usata,
la feature è progettata male.*

## Caratteristiche

**Al tavolo**
- ⚔️ **Combat tracker** — iniziativa, punti ferita con le regole SRD fatte bene, condizioni,
  concentrazione, tiri contro morte, attacchi cliccabili dagli stat block, e **annulla**
- 📺 **Vista Giocatori** — una seconda finestra da condividere su Discord: i mostri a fasce
  («Ferito», «Malconcio»), mai i numeri; imboscate nascoste; handout con immagini
- 🛡️ **Il gruppo** — CA, Percezione passiva e tiri salvezza di tutti, a colpo d'occhio
- ⚖️ **Scontri** — scegli i mostri e scopri se rischiano di uccidere il gruppo
- 🗺️ **Mappe** — battlemap con griglia, segnalini presi dal combattimento, righello e nebbia
  di guerra: ai giocatori arriva solo ciò che hai rivelato. Mappa del mondo con i luoghi
  collegati alle note, noti o segreti

**La campagna**
- 🏰 **Campagne**, 🧙 **personaggi e PNG** con i segreti riservati al DM
- 📜 **Note** che si collegano da sole: scrivi `[[Titolo]]`
- 🗓 **Sessioni** — preparazione in otto passi alla Lazy DM, diario con il riassunto dei
  combattimenti; i segreti non scoperti passano alla sessione successiva
- 🔮 **Generatori** — PNG, taverne, botteghe, voci di paese, spunti, incontri, tesori
- 📦 **Archivio** — una campagna in un solo file, immagini comprese: per non perderla mai, o per
  portarla su un altro PC

**Compendio offline**
- 📖 334 mostri, 319 incantesimi, 599 oggetti, 48 regole e condizioni, glossario IT↔EN —
  e la ricerca in italiano trova anche i testi inglesi
- 📚 **Fonti aperte** — altri 1.900 mostri da manuali con licenza aperta (Tome of Beasts,
  Creature Codex…) via [Open5e](https://open5e.com): si scaricano con un clic, poi funzionano
  senza rete, ognuno con la sua fonte e la sua licenza
- 🎲 **Dadi** con notazione completa (`4d6kh3`, `2d20kh1`, `8d6/2`)

### In arrivo
Audio d'ambiente, app desktop. Vedi la
[roadmap](docs/memory/active-context.md).

## Requisiti

- **Node.js ≥ 22**
- Rete solo al primo avvio, per scaricare i dati SRD

## Avvio

```bash
npm install
npm run setup   # scarica e importa i dati SRD (richiede rete, una volta sola)
npm run dev     # → http://localhost:3000
```

Le tue campagne vivono in `data/jumpmaster.db`, **fuori dal controllo di versione**: il repo è
pubblico, i tuoi dati restano tuoi. Per un backup basta copiare quel file.

> 💡 **Consiglio per Discord**: installa l'app come PWA dal browser. Si apre in una finestra dedicata
> senza barre, molto più pulita da condividere.

## Come è fatto

Next.js 16 · React 19 · TypeScript strict · Tailwind 4 · Drizzle ORM · SQLite · Vitest

L'architettura è a **slice verticali**: aggiungere una feature significa creare una cartella in
`src/features/` e registrare una voce di menu, non toccare quindici file sparsi. La matematica di D&D
vive isolata in `src/core/rules/` con test sui casi limite — perché un budget PE sbagliato rovina
una serata.

Il progetto segue **spec-driven development** con **memory banking**, e le regole di processo non sono
prosa: `npm run guard` fa fallire commit e CI se una feature non ha una spec, se il memory bank non è
aggiornato o se un confine architetturale viene violato.

📄 Il contratto operativo completo è in **[AGENTS.md](AGENTS.md)**.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Avvia l'app |
| `npm run setup` | Scarica e importa i dati SRD |
| `npm run guard` | ⚔ Verifica i guard rail di processo |
| `npm test` | Test unitari |
| `npm run typecheck` · `npm run lint` | Qualità |

## Licenza e attribuzione

Il codice è sotto licenza [MIT](LICENSE).

> This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of
> the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document — licensed
> under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

Progetto amatoriale non ufficiale, senza alcuna affiliazione con Wizards of the Coast.
Dettagli completi in [NOTICE](NOTICE).

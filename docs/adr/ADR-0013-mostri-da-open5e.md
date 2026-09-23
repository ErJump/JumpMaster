# ADR-0013 — Mostri da Open5e: scaricati dal DM, in tabelle proprie, con la loro licenza

- **Stato:** accepted
- **Data:** 2026-09-23

## Contesto

I 334 mostri dell'SRD 5.1 bastano per iniziare, non per una campagna lunga. [Open5e](https://open5e.com)
espone via API i mostri di manuali pubblicati con licenze aperte — *Tome of Beasts 1–3* e *Creature
Codex* di Kobold Press, fra gli altri: oltre 1.500 creature compatibili con il regolamento 2014.

Tre domande:

1. **Licenze.** Quei manuali sono Open Game Content sotto **OGL 1.0a** (alcuni sotto CC-BY-4.0).
   L'OGL chiede che il contenuto viaggi con il testo della licenza e con l'indicazione della fonte.
2. **Dove metterli.** L'invariante I5 dice che le tabelle `srd_*` contengono l'SRD e si rigenerano
   dal suo import. Mescolarci altro renderebbe falsa l'invariante e farebbe sparire i mostri Open5e
   a ogni `srd:import`.
3. **Che forma dare ai dati.** Lo stat block, il costruttore di scontri e il combat tracker leggono
   il formato dell'SRD (5e-bits). Open5e ha un formato suo.

## Decisione

- **Il repository non contiene contenuti Open5e.** È il DM a scaricarli, con un clic, dentro il
  proprio database. È l'unica chiamata di rete dell'app oltre a `srd:fetch`, ed è esplicita
  (AGENTS.md §5).
- **Ogni mostro porta la sua fonte**: manuale, editore, licenza. Lo stat block la mostra, e il
  testo completo di ogni licenza (scaricato dall'API insieme ai dati) è consultabile nell'app.
- **Tabelle proprie**: `open5e_documents`, `open5e_licenses`, `open5e_monsters`. Sola lettura a
  runtime, scritte solo dal loro import (I5 si estende a loro).
- **Una vista SQL `monsters`** unisce `srd_monsters` e `open5e_monsters` con una colonna `source`.
  Bestiario, scontri e combattimento leggono la vista: non sanno da dove viene un mostro.
- **Al momento dell'import i dati si convertono nel formato SRD** (`src/content/open5e/normalize.ts`,
  puro e testato). Lo stat block resta uno solo, e gli attacchi dei mostri Open5e sono cliccabili
  come gli altri.
- **Solo regolamento 2014.** Esclusi l'SRD 5.1 (già presente), l'SRD 5.2 e i sistemi diversi
  (5e 2024, Advanced 5th Edition): mescolare regole diverse confonderebbe un DM alle prime armi.
- Gli slug Open5e (`tob2_…`) contengono il prefisso del manuale: non collidono con quelli SRD.

## Conseguenze

- Rimuovere un manuale non rompe gli scontri: `encounter_monsters` conserva già una copia dei
  numeri (SPEC-0006). Si perde solo lo stat block completo di quei mostri.
- Una colonna in più nelle tabelle dei mostri va aggiunta anche alla vista.
- Non siamo avvocati. La scelta è prudente: niente contenuto redistribuito dal progetto, fonte e
  licenza sempre visibili accanto al contenuto.

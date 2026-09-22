# SPEC-0003 — Design

## Importer

```
src/content/srd/
  datasets.ts   · elenco dei dataset: nome file, tabella, conteggio atteso
  fetch.ts      · scarica i JSON da raw.githubusercontent.com → data/ (in .gitignore)
  import.ts     · legge, normalizza, scrive in SQLite; stampa i conteggi
  normalize.ts  · funzioni pure di normalizzazione (testate)
```

**Strategia di scrittura**: `DELETE` della tabella + `INSERT` in una transazione. Sono tabelle in sola
lettura e rigenerabili (invariante I5), quindi è più semplice e più sicuro di un upsert riga per riga —
e rende l'import idempotente per costruzione (AC3).

**JSON conservato**: ogni riga mantiene il payload originale in una colonna `data` (JSON) oltre alle
colonne indicizzate. Così la ricerca e i filtri sono veloci senza dover modellare a colonne ogni
dettaglio di uno stat block, e nessuna informazione dell'SRD va persa.

```sql
srd_monsters(index PK, name, size, type, alignment, cr REAL, cr_label, xp, ac, hp, data JSON)
-- cr è REAL perché i GS frazionari valgono 0.125 / 0.25 / 0.5;
-- cr_label conserva la resa tipografica "⅛" "¼" "½" (AC6).
```

Indici su `name`, `cr`, `type`, `size` per i filtri (AC18).

## Ricerca

FTS5 sarebbe l'opzione elegante per il testo pieno delle regole (AC14), ma su 33 sezioni e 334 mostri
un `LIKE` con indice è già istantaneo. Partiamo semplici: se e quando il contenuto crescerà (Open5e,
M6), si valuta FTS5 con un ADR.

## Modificatori: una sola fonte di verità

I modificatori di caratteristica, il bonus di competenza e le etichette dei GS **non** si calcolano
nei componenti: vengono da `src/core/rules/` (AC8). È la regola I1 e serve a garantire che lo stesso
numero mostrato nel bestiario sia quello usato dal combat tracker in M2.

## Slice

Ogni slice segue lo stesso schema — elenco ricercabile a sinistra, dettaglio a destra — e condivide le
primitive di `src/ui/`: `SearchableList`, `FilterBar`, `DetailPanel`, `StatBlock`.

Duplicazione accettata consapevolmente (ADR-0004): sono cinque slice con query diverse su tabelle
diverse. Ciò che si ripete davvero sale in `ui/`, non prima.

## Glossario

Dati in `src/features/glossary/data.ts`, derivati da `docs/memory/glossary-dnd.md` (che resta la fonte
di verità per gli agenti). Ricerca su entrambe le lingue tramite normalizzazione (minuscole, accenti
rimossi).

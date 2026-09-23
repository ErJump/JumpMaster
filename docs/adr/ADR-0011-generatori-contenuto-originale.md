# ADR-0011 — Generatori: contenuto originale, dati di gioco dall'SRD

- **Stato:** accepted
- **Data:** 2026-09-23

## Contesto

I generatori di M4 (PNG, taverne, botteghe, voci di paese, spunti, incontri, tesori) hanno
bisogno di tabelle. Quelle «classiche» — tesori per grado di sfida, incontri casuali per
ambiente, tratti dei PNG — stanno nella **Guida del DM**, non nell'SRD. Come per il bilanciamento
(ADR-0008), non esiste una fonte aperta da cui prenderle, e `AGENTS.md` §5 vieta contenuti non-SRD.

## Decisione

1. **Tutti i testi dei generatori sono scritti per JumpMaster**: nomi (costruiti per sillabe,
   quindi sempre nuovi), aggettivi, mestieri, voci, spunti, complicazioni. In italiano.
2. **I dati di gioco vengono dall'SRD**: i mostri degli incontri, gli oggetti delle botteghe e
   gli oggetti magici dei tesori sono pescati dal nostro database.
3. **Incontri casuali**: si generano mostri e si tiene il risultato solo se la stima di
   ADR-0008 cade nella fascia richiesta. Un solo metro di difficoltà in tutta l'app.
4. **Tesori**: formula nostra, dichiarata come tale nell'interfaccia — monete che crescono col
   livello, oggetti magici di rarità coerente col livello.
5. I generatori sono **funzioni pure** in `src/core/generators/`, con generatore casuale
   iniettabile: testabili in modo deterministico, come i dadi.

## Conseguenze

- Nessun contenuto protetto; i testi hanno un tono coerente con l'app, in italiano.
- I tesori non combaceranno con le tabelle della Guida del DM: va detto, come per la difficoltà.
- La qualità dei generatori dipende dalla ricchezza delle tabelle che scriviamo: si allargano
  nel tempo senza toccare il codice.

## Alternative scartate

- **Copiare le tabelle della Guida del DM** — viola `AGENTS.md` §5.
- **Generazione con un modello linguistico** — richiede rete e una chiave, contraddice il
  requisito offline al tavolo. Potrà arrivare come aggiunta facoltativa, mai come base.

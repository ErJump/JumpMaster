# SPEC-0007 — Tasks

## core/events (la parte che non può sbagliare)
- [ ] `combat-types.ts`
- [ ] `hit-points.ts`: temporanei, 0 PF, danno massiccio, critico, cura da 0
- [ ] **Test delle regole SRD con tutti i casi limite** — prima del resto
- [ ] `combat-reduce.ts`: riduzione pura, ordinamento deterministico, turni e round
- [ ] Test del riduttore: annulla, ordine, rimozione durante il turno, concentrazione

## Dati
- [ ] Schema `combat_events` + migrazione
- [ ] `queries.ts` (leggi eventi → riduci), `actions.ts` (aggiungi evento, annulla)

## Interfaccia
- [ ] Avvio da uno scontro: PG automatici, mostri numerati, PF medi o tirati
- [ ] Inserimento iniziativa, con tiro automatico per i mostri
- [ ] Ordine di iniziativa **leggibile da lontano**, turno corrente inequivocabile
- [ ] Pannello del combattente: danno, cura, temporanei, condizioni, tiri contro morte
- [ ] Promemoria di concentrazione con la CD già calcolata
- [ ] Promemoria azioni leggendarie a fine turno altrui
- [ ] Stat block consultabile con **attacchi cliccabili** (`core/dice`)
- [ ] Registro in italiano + **Annulla** ripetibile
- [ ] Scorciatoie da tastiera
- [ ] Conclusione del combattimento

## Verifiche
- [ ] AC1–AC23 provati a mano
- [ ] **Simulare un combattimento vero** dall'inizio alla fine, sbagliando apposta e annullando

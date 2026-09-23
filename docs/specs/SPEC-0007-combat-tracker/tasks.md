# SPEC-0007 — Tasks

## core/events (la parte che non può sbagliare)
- [x] `combat-types.ts`
- [x] `hit-points.ts`: temporanei, 0 PF, danno massiccio, critico, cura da 0
- [x] **Test delle regole SRD con tutti i casi limite** — prima del resto (30 test)
- [x] `combat-reduce.ts`: riduzione pura, ordinamento deterministico, turni e round, **salto dei morti**
- [x] Test del riduttore: annulla, ordine, rimozione durante il turno, concentrazione (33 test)

## Dati
- [x] Schema `combat_events` + migrazione
- [x] `queries.ts`, `actions.ts` — riduzione **nel browser**, salvataggio in coda ordinata (`useCombat`)

## Interfaccia
- [x] Avvio da uno scontro: PG automatici, mostri numerati, PF medi o tirati
- [x] Inserimento iniziativa, con tiro automatico per i mostri
- [x] Ordine di iniziativa **leggibile da lontano**, turno corrente inequivocabile
- [x] Pannello del combattente: danno, cura, temporanei, condizioni, tiri contro morte
- [x] Promemoria di concentrazione con la CD già calcolata, con «Riuscito» / «Fallito»
- [x] Promemoria azioni leggendarie a fine turno altrui (non ancora provato: vedi spec)
- [x] Stat block con **attacchi cliccabili** e **raddoppio dei dadi sul critico**
- [x] Registro in italiano + **Annulla** che dice cosa annullerà
- [x] Scorciatoie da tastiera (`useEffectEvent`)
- [x] Conclusione del combattimento

## Verifiche
- [ ] AC1–AC23 provati a mano
- [x] **Simulato un combattimento vero**, sbagliando apposta e annullando — vedi spec
- [ ] AC2 (PF tirati), AC9 (condizioni), AC15 (leggendari) da provare a mano

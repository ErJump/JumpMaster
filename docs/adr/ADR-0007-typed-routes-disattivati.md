# ADR-0007 — `typedRoutes` disattivato

- **Stato:** accepted
- **Data:** 2026-09-22

## Contesto

Next.js offre `typedRoutes`, che tipizza gli `href` e segnala a compile time i link a rotte
inesistenti. Era attivo nello scaffold iniziale.

Al primo `npm run typecheck` con pagine reali ha prodotto una dozzina di errori, tutti della
stessa natura:

```
Type '`/campagne/${number}`' is not assignable to type 'RouteImpl<`/campagne/${number}`>'
```

Il problema non è un link sbagliato: è che i template literal non soddisfano il tipo generato.
Per ogni link dinamico servirebbe la forma verbosa `href={{ pathname: '/campagne/[id]', query: { id } }}`
oppure un cast.

JumpMaster è un'app **fatta quasi solo di link dinamici**: ogni voce del bestiario, ogni
incantesimo, ogni oggetto, ogni sezione di regole. Sono migliaia di link generati da cicli.

## Decisione

Disattivare `typedRoutes`, e tipizzare `FeatureConfig.href` come `string`.

## Conseguenze

- Perdiamo la verifica a compile time dei link interni.
- In cambio i link restano leggibili: `href={`/bestiario/${monster.slug}`}` invece della forma
  a oggetto ripetuta ovunque.

Il compromesso regge perché un link interno rotto in questa app è un bug che si scopre
**cliccandolo**, cioè entro pochi secondi in un'applicazione che l'autore usa di persona. Il costo
di prevenirlo sarebbe cerimonia su ogni singolo collegamento, per sempre. I test end-to-end con
Playwright coprono comunque i percorsi principali.

## Quando rivedere

Se Next.js supporterà i template literal per le rotte dinamiche, o se il numero di link rotti
scoperti a mano diventasse fastidioso.

## Alternative scartate

- **Tenerlo attivo con cast** — un `as Route` sparso ovunque disattiva il controllo mantenendone
  tutto il rumore: il peggio dei due mondi.
- **Funzioni helper per ogni rotta** (`routes.monster(slug)`) — un livello di indirezione in più da
  mantenere allineato a mano alla struttura delle cartelle, che è proprio ciò che `typedRoutes`
  doveva evitare.

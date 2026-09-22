# ADR-0008 — Bilanciamento degli scontri senza le tabelle della Guida del DM

- **Stato:** accepted
- **Data:** 2026-09-22

## Contesto

L'Encounter Builder (SPEC-0006) deve dire al DM se uno scontro è troppo facile o rischia di
uccidere il gruppo. Il metodo standard di D&D 5e 2014 usa due tabelle della **Guida del Dungeon
Master**: le soglie di PE per personaggio e livello (Facile / Medio / Difficile / Mortale) e il
moltiplicatore per numero di mostri.

**Quelle tabelle non sono nell'SRD.** Verificato sui dati che importiamo: le 33 sezioni di regole
dell'SRD 5.1 non contengono «XP threshold», «encounter difficulty», «encounter multiplier» né
«adventuring day». Nemmeno l'SRD 2024 le include: il suo dataset non ha affatto sezioni di regole.
Non esiste una fonte aperta da cui attingerle.

`AGENTS.md` §5 vieta contenuti non-SRD nel repo. Riprodurre quelle tabelle lo violerebbe.

## Decisione

Costruire una stima **nostra**, trasparente, usando solo dati che abbiamo legittimamente: i **punti
esperienza di ogni mostro**, che sono parte dell'SRD e già nel nostro database.

```
peTotali      = somma dei PE dei mostri
peEffettivi   = peTotali × fattoreAzioni(numeroMostri)
riferimento   = PE di un mostro di GS pari al livello del gruppo × (dimensioneGruppo / 4)
rapporto      = peEffettivi / riferimento
```

`fattoreAzioni` tiene conto dell'economia delle azioni: otto goblin sono più pericolosi di un
singolo mostro con gli stessi PE totali, perché agiscono otto volte per round.

Il rapporto si traduce in cinque fasce, mostrate in italiano con una frase che dice **cosa
aspettarsi**, non solo un'etichetta: «Impegnativo — dovrebbero farcela, ma ci lasceranno risorse».

**L'app dichiara apertamente che è una stima propria**, e mostra il calcolo: PE totali, fattore
applicato, riferimento del gruppo. Niente scatola nera.

## Conseguenze

**Guadagniamo**
- Nessun contenuto protetto nel repo.
- Una stima **spiegabile**. L'utente è un DM alle prime armi: «questo scontro vale circa quanto un
  mostro di GS 5 contro il tuo gruppo di livello 5» gli dice qualcosa; «budget PE 3.400 su 2.800»
  non gli dice niente.
- Possiamo tarare le fasce sull'esperienza reale al tavolo, invece di essere legati a una tabella.

**Paghiamo**
- I numeri **non combaceranno** con quelli della Guida del DM o di strumenti come Kobold Fight Club.
  Va detto chiaramente nell'interfaccia, altrimenti il DM penserà che l'app sbagli.
- La taratura delle fasce è un giudizio nostro: andrà corretta con l'uso. Per questo il calcolo
  resta visibile e le soglie stanno in un solo punto di `core/rules`.

## Alternative scartate

- **Riprodurre le tabelle della Guida del DM** — viola `AGENTS.md` §5. Che tabelle di numeri siano
  o meno tutelabili è una questione aperta, ma la regola che ci siamo dati parla di fonti, non di
  cavilli: se non è SRD o aperto, non entra.
- **Chiedere al DM di inserire le soglie a mano** — scaricherebbe su di lui esattamente il lavoro
  che l'app esiste per evitare.
- **Rinunciare alla stima** e mostrare solo la somma dei PE — lascerebbe senza risposta la domanda
  che il DM alle prime armi si pone davvero: «questo scontro ammazzerà il gruppo?».

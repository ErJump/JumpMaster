---
id: SPEC-0006
slug: costruttore-scontri
title: Costruttore di scontri
milestone: M2
status: in-progress
updated: 2026-09-22
---

# SPEC-0006 — Costruttore di scontri

## Perché

«Quattro goblin e un orco sono troppi per un gruppo di livello 2?» È la domanda che un DM alle prime
armi non sa rispondere, e sbagliarla significa o annoiare il tavolo o uccidere un personaggio nella
prima sessione.

Serve anche poter **preparare** gli scontri prima della serata e riaprirli al momento giusto,
invece di cercare i mostri sul momento mentre quattro persone aspettano.

## Cosa

Scontri salvati per campagna, composti scegliendo mostri dal bestiario, con una **stima della
difficoltà** spiegata.

### La stima

⚠️ Le tabelle di bilanciamento della Guida del DM **non sono nell'SRD** e non esiste una fonte
aperta da cui prenderle. La stima è **nostra** e va dichiarata come tale nell'interfaccia.
Il metodo e le ragioni sono in [ADR-0008](../../adr/ADR-0008-bilanciamento-scontri.md).

```
peTotali    = somma dei PE dei mostri (dato SRD)
peEffettivi = peTotali × fattoreAzioni(numeroMostri)
riferimento = PE di un mostro di GS pari al livello del gruppo × (dimensioneGruppo / 4)
rapporto    = peEffettivi / riferimento
```

Cinque fasce, ognuna con una frase che dice **cosa aspettarsi**:

| Fascia | Cosa dire al DM |
|---|---|
| Banale | «Non li scalfirà. Va bene per mostrare quanto sono diventati forti.» |
| Facile | «Se la caveranno senza fatica. Qualche punto ferita, nulla di più.» |
| Impegnativo | «Dovrebbero farcela, ma ci lasceranno risorse. È lo scontro tipico di una sessione.» |
| Duro | «Rischiano davvero. Qualcuno potrebbe cadere a 0 punti ferita.» |
| Letale | «Può uccidere un personaggio, o il gruppo intero se va male. Usalo di proposito.» |

## Criteri di accettazione

- [ ] **AC1** — Posso creare uno scontro con un nome e aggiungere mostri dal bestiario, con una
      quantità per ciascuno.
- [ ] **AC2** — Vedo i PE totali, il fattore applicato per il numero di mostri, il riferimento del
      gruppo e la fascia risultante. **Nessun numero senza spiegazione.**
- [ ] **AC3** — La stima si aggiorna **all'istante** mentre aggiungo o tolgo mostri.
- [ ] **AC4** — L'interfaccia dichiara apertamente che è una stima dell'app, **non** una regola
      ufficiale, e che i numeri non combaceranno con quelli della Guida del DM.
- [ ] **AC5** — La stima usa il livello e la dimensione del gruppo presi dai PG della campagna
      (SPEC-0005), non un valore digitato a mano.
- [ ] **AC6** — Se nella campagna non c'è nessun PG, lo scontro si può comporre lo stesso ma la
      stima spiega che le manca il gruppo di riferimento.
- [ ] **AC7** — Posso salvare, riaprire, modificare ed eliminare uno scontro.
- [ ] **AC8** — Ogni riga mostra il mostro con GS, PE e punti ferita, e porta alla sua scheda.
- [ ] **AC9** — Da uno scontro posso **avviare il combattimento** (SPEC-0007) con un clic.
- [ ] **AC10** — La somma dei PE e la fascia sono calcolate da `core/rules` con test sui casi limite.
- [ ] **AC11** — Gli scontri appartengono alla campagna attiva.

## Fuori ambito

Generazione automatica di scontri. Mostri personalizzati. Tesori (M4). Scontri sociali o esplorativi.

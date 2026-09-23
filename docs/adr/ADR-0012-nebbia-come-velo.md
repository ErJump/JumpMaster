# ADR-0012 — La nebbia di guerra è un velo, non un'immagine censurata

- **Stato:** accepted
- **Data:** 2026-09-23

## Contesto

Sulla battlemap (SPEC-0012) il DM rivela la mappa a poco a poco. La Vista Giocatori deve
mostrare solo le zone rivelate.

Ci sono due modi di farlo:
1. **Ritagliare l'immagine sul server**, inviando ai giocatori solo i pixel rivelati;
2. **Coprire l'immagine con un velo** nella pagina dei giocatori.

Il primo richiede di decodificare e ricodificare PNG e JPEG sul server: una libreria di
elaborazione immagini, nativa e pesante, per un'app che gira su un PC.

## Decisione

La nebbia è un **velo opaco** disegnato sopra l'immagine nella Vista Giocatori.

Ciò che invece si protegge **nei dati**, come in ADR-0009: i **segnalini** che stanno sotto la
nebbia e quelli dei combattenti nascosti **non vengono inviati** alla finestra dei giocatori.
Nessun segnale tradisce dove si trova il nemico.

## Conseguenze

- Chi *guarda* la Vista — su Discord, su un secondo schermo, sul portatile girato verso il tavolo —
  vede solo le zone rivelate. È l'uso per cui la Vista è stata pensata (SPEC-0008).
- **Chi aprisse la Vista sul proprio dispositivo** potrebbe, con gli strumenti del browser, aprire
  l'immagine intera. Lo dice anche l'interfaccia: la Vista si **mostra**, non si **consegna**.
- Nessuna dipendenza nativa in più.

## Quando rivedere

Se un giorno i giocatori apriranno la Vista dai loro dispositivi (M6: app ospitata), servirà il
ritaglio lato server, con un ADR e la libreria che comporta.

## Alternative scartate

- **Ritaglio con una libreria di immagini** — costo sproporzionato all'uso attuale.
- **Ritaglio su `<canvas>` nel browser dei giocatori** — l'immagine intera arriverebbe comunque:
  stessa protezione del velo, più complessità.

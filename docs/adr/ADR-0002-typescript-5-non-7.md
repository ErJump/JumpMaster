# ADR-0002 — TypeScript 5.9 invece di 7.x

- **Stato:** accepted
- **Data:** 2026-09-22

## Contesto

Al momento dello scaffold, `npm view typescript dist-tags` dà **7.0.2** come `latest`. TypeScript 7 è
il port nativo in Go del compilatore, molto più veloce e presentato come drop-in replacement.

## Decisione

Restare su **`typescript` 5.9.3**.

## Conseguenze

- Rinunciamo per ora al notevole guadagno di velocità del compilatore nativo.
- In cambio evitiamo di dipendere da una combinazione (TS 7 + pipeline di generazione tipi di
  Next 16 + `eslint-config-next`) che nessuno dei due progetti dichiara ancora di supportare.

Per un'app che deve **funzionare al tavolo**, e il cui utente non è in grado di diagnosticare un
errore oscuro del compilatore in mezzo alla sessione, la stabilità vale più della velocità di build.
Un typecheck che impiega due secondi in più non si nota; un `next build` che esplode con un errore di
tipi incomprensibile blocca tutto.

## Quando rivedere

Quando Next.js dichiara il supporto ufficiale a TypeScript 7. A quel punto la migrazione dovrebbe
essere il solo cambio di versione: `noEmit` è già attivo e non usiamo transform esotici.

## Alternative scartate

- **TypeScript 7.0.2 subito** — rischio non ripagato in questa fase.
- **Fissare 5.9.3 senza ADR** — una scelta che va contro il `latest` di npm deve essere scritta,
  altrimenti fra sei mesi qualcuno "aggiorna e basta" senza sapere perché era fissata.

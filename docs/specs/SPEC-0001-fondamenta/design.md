# SPEC-0001 — Design

## Guard rail (`scripts/guard.mjs`)

Lo script implementa sei regole. Struttura: ogni regola raccoglie violazioni in una lista con
*messaggio* + *come si sistema*; l'output raggruppa per regola ed esce con codice 1 se ce n'è almeno una.

| Regola | Verifica | Note |
|---|---|---|
| **R0** | I 7 file del memory bank e `AGENTS.md` esistono | strutturale |
| **R1** | Ogni `src/features/<x>/` è registrata in `docs/specs/index.json`; nessuna spec `done` dichiara feature inesistenti | strutturale |
| **R2** | Se il changeset tocca `src/`, deve toccare anche `active-context.md` e `progress.md` | richiede un changeset |
| **R3** | Front-matter delle spec valido (`id`, `status`, `updated` ISO), allineato a `index.json`; nessuna spec `draft` con codice già presente | strutturale |
| **R4** | Ogni dipendenza di `package.json` è nominata in almeno un file di `docs/adr/` | strutturale |
| **R5** | Invarianti I1 (`core/` puro) e I2 (feature non si importano fra loro), via analisi degli import | strutturale |

### Modalità

- `node scripts/guard.mjs` → solo regole strutturali (R2 saltata con una nota esplicita)
- `--staged` → changeset = `git diff --cached --name-only` (usato dall'hook `pre-commit`)
- `--ci` → changeset = `git diff <merge-base>..HEAD` rispetto a `GUARD_BASE_REF` (default `origin/main`)

La separazione serve perché R2 è intrinsecamente legata a un insieme di modifiche: senza changeset non
è valutabile, e fingere di valutarla darebbe falsi negativi.

### Perché l'analisi degli import è testuale e non via AST

Una regex sugli `import ... from '...'` copre i casi reali di questo repo con zero dipendenze
aggiuntive. Un parser TypeScript sarebbe più preciso ma aggiungerebbe una dipendenza pesante per
proteggere due invarianti semplici. Se un domani i falsi negativi diventassero un problema, si passa a
`ts-morph` con un ADR.

## Hook

`core.hooksPath = .githooks` invece di copiare file in `.git/hooks/`: così gli hook restano
**versionati**, visibili in code review e aggiornabili per tutti con un pull. Il collegamento avviene
in `scripts/install-hooks.mjs`, eseguito dallo script `prepare` di npm (cioè a ogni `npm install`),
e viene saltato in CI e quando manca `.git`.

## CI

`.github/workflows/guardrails.yml` esegue `guard --ci`, `typecheck`, `lint`, `test` e `build`.
Gira su push e su PR verso `main`.

## Design system

Tailwind 4 usa la configurazione **CSS-first**: i token stanno in `src/ui/theme.css` sotto `@theme`.
Non esiste `tailwind.config.js` e non va creato.

- Due palette: *pergamena e inchiostro* (chiara) e *notte in taverna* (scura, **default**).
- Font: **Cinzel** per i titoli, **EB Garamond** per il corpo, **JetBrains Mono** per i dadi.
  Caricati da Google Fonts tramite `next/font`, che li auto-ospita: nessuna richiesta di rete a runtime.
- Vincolo Discord (`AGENTS.md` §6): contrasto ≥ 4.5:1, corpo ≥ 16px, niente font light su texture.

## Registro delle feature

`src/features/registry.ts` importa i `feature.config.ts` e li espone ordinati per la navigazione.
Aggiungere una feature alla UI = una riga qui.

```ts
export type FeatureConfig = {
  id: string;          // combacia col nome della cartella e con index.json
  title: string;       // etichetta in italiano
  description: string;
  href: string;
  icon: string;
  group: 'campagna' | 'compendio' | 'tavolo' | 'strumenti';
  order: number;
  requiresCampaign: boolean;
};
```

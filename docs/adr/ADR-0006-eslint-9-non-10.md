# ADR-0006 — ESLint 9 invece di 10

- **Stato:** accepted
- **Data:** 2026-09-22

## Contesto

Installando **`eslint`** 10.11.0 (l'ultima versione) insieme a **`eslint-config-next`** 16.3.5,
`npm run lint` non parte proprio:

```
TypeError: Error while loading rule 'react/display-name':
contextOrFilename.getFilename is not a function
```

`eslint-plugin-react`, che `eslint-config-next` porta con sé, usa `context.getFilename()`: un'API
rimossa in ESLint 10. Il campo `peerDependencies` di `eslint-config-next` dichiara `eslint >= 9.0.0`,
ma la versione 10 non è di fatto supportata.

È lo stesso schema già visto in ADR-0002 con TypeScript 7: il `latest` di npm non coincide con ciò
che il framework supporta davvero.

## Decisione

Fissare **`eslint` 9.39.5** (l'ultima della serie 9).

Nello stesso passaggio è caduta la dipendenza **`@eslint/eslintrc`**: serviva solo per `FlatCompat`,
che a sua volta andava in errore su ESLint 10 (struttura circolare). `eslint-config-next` 16 esporta
già flat config nativi, quindi `eslint.config.mjs` li importa direttamente. Una dipendenza in meno.

## Conseguenze

- Rinunciamo alle novità di ESLint 10 finché `eslint-config-next` non aggiorna i suoi plugin.
- In cambio `npm run lint` funziona, che è il minimo sindacale per un comando presente nella
  Definition of Done e nella CI.
- Configurazione più semplice: due import nativi invece del livello di compatibilità.

## Quando rivedere

Quando `eslint-config-next` aggiorna `eslint-plugin-react` a una versione compatibile con ESLint 10.

## Alternative scartate

- **Rimuovere `eslint-config-next`** e configurare i plugin a mano — perderemmo le regole specifiche
  di Next (Core Web Vitals, uso corretto di `next/image` e `next/link`) proprio in un progetto in cui
  la UX è requisito primario.
- **Disattivare le regole di `eslint-plugin-react`** — l'errore è in fase di caricamento del plugin,
  non a livello di singola regola: non si aggira così.

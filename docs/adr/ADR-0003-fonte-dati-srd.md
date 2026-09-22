# ADR-0003 — Fonte dati SRD bundlata offline

- **Stato:** accepted
- **Data:** 2026-09-22

## Contesto

Servono mostri, incantesimi, oggetti e regole di D&D 5e in forma strutturata, **legalmente**, e
**disponibili anche senza rete**: se salta il Wi-Fi a metà sessione il combattimento deve continuare.

L'SRD 5.1 è sotto **CC-BY-4.0** dal 2023, in modo irrevocabile. L'uso è libero, anche commerciale,
a patto di includere l'attribuzione.

## Decisione

Importare i JSON di [`5e-bits/5e-database`](https://github.com/5e-bits/5e-database) (licenza MIT),
cartella `src/2014/en/`, nelle tabelle `srd_*` del database locale.

- `npm run srd:fetch` scarica i JSON in `src/content/srd/data/` (in `.gitignore`).
- `npm run srd:import` li normalizza e popola SQLite.
- A runtime l'app **non fa alcuna chiamata di rete**.

Attribuzione obbligatoria nel file `NOTICE`, nel README e visibile dentro l'app.

## Conseguenze

**Guadagniamo**
- ~3,4 MB di dati: 334 mostri, 319 incantesimi, 362 oggetti magici, 237 equipaggiamenti,
  407 privilegi, **33 sezioni di regole**, 15 condizioni.
- Le 33 sezioni di regole alimentano la feature "Regole rapide", che è centrale per un DM novizio.
- Funzionamento offline garantito e nessun rate limit.
- Nessun dato di gioco nel repo: si rigenera tutto, il repo resta leggero.

**Paghiamo**
- I dati sono **in inglese**: l'SRD italiano ufficiale esiste solo in PDF, non strutturato. Mitigato
  dal glossario IT↔EN (`docs/memory/glossary-dnd.md` + feature Glossario).
- L'SRD è limitato su alcune aree: **9 razze, 12 classi, 1 solo background**. Per questo la
  "creazione personaggi" è declassata a *registrazione schede PG + Party Dashboard*: al DM serve
  molto di più avere CA e Percezione passiva sott'occhio che costruire un PG da zero.
- Serve un primo `npm run setup` con rete.

## Alternative scartate

- **Chiamare `dnd5eapi.co` o Open5e a runtime** — viola il requisito offline. Inaccettabile.
- **Scraping di 5e.tools o D&D Beyond** — contro i ToS e contenuto protetto.
- **Trascrivere i manuali** — illegale: solo SRD e fonti open.
- **Open5e come fonte primaria** — ottimo per ampliare (3500+ creature da Tome of Beasts ecc.) ma è
  un superset che mescola fonti diverse. Meglio partire dall'SRD puro e aggiungerlo in M6.

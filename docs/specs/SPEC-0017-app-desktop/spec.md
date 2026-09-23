---
id: SPEC-0017
slug: app-desktop
title: JumpMaster come app sul desktop
milestone: M6
status: done
updated: 2026-09-23
---

# SPEC-0017 — JumpMaster come app sul desktop

## Perché

Oggi per usare JumpMaster il DM apre un terminale, scrive `npm run dev`, apre il browser e trova la
scheda giusta fra le altre. Prima della sessione è un attrito; durante, una finestra del browser
con venti schede è un rischio su Discord. Vedi ADR-0014.

## Criteri di accettazione

- [x] **AC1** — L'app ha un manifest valido (nome, icone 192 e 512, avvio a tutto schermo senza
      barra) e un'icona sua, anche nella scheda del browser.
- [x] **AC2** — Le icone sono generate dall'app, funzionano senza rete, e reggono il tema scuro e
      chiaro del sistema.
- [x] **AC3** — `npm run app` avvia JumpMaster senza altro da fare: compila se il codice è più
      nuovo della build, avvia il server in background, apre la finestra quando risponde.
- [x] **AC4** — Se JumpMaster è già acceso, `npm run app` apre solo la finestra.
- [x] **AC5** — `npm run app -- --stop` lo spegne.
- [x] **AC6** — Su macOS `npm run app:install` crea `JumpMaster.app` con l'icona: doppio clic e parte.
- [x] **AC7** — La porta dell'app (3210) non si scontra con lo sviluppo (3000).
- [x] **AC8** — La home spiega come aggiungere JumpMaster al Dock o installarlo, per il browser
      che si sta usando.

## Verifica eseguita — 2026-09-23

| AC | Cosa è successo |
|---|---|
| AC1 | `/manifest.webmanifest` (standalone, icone 192, 512 e mascherabile), icona della scheda e `apple-icon` collegate nell'`<head>` |
| AC2 | Icone PNG generate da SVG con `ImageResponse`, senza file né caratteri scaricati; tessera scura con bordo dorato, leggibile su Dock chiaro e scuro (guardate a 512 px) |
| AC3 | `npm run app -- --no-open`: build + server + risposta in 6 s. Toccato un file in `src/`: ricompila da solo |
| AC4 | Seconda volta: «già acceso», nessuna build, nessun secondo server |
| AC5 | `--stop`: server spento (porta muta); un secondo `--stop` lo dice |
| AC6 | `app:install --dest <prova>`: `Info.plist` valido (`plutil`), script di avvio con il Node stabile del PATH, `AppIcon.icns` da 150 KB. **Non** installata in `~/Applications`: lo fa Giampiero |
| AC7 | App su 3210, sviluppo su 3000, accesi insieme durante le prove |
| AC8 | Riquadro in home: Safari, Chrome/Edge, o l'avviatore per gli altri (Opera GX, Firefox); sparisce aperto come app. Classificazione del browser testata |

### Emerso provando

- **Le spade non comparivano nell'icona**: il motore di `ImageResponse` non espande componenti
  React dentro un `<svg>`. Ora sono chiamate come funzioni.
- **Il percorso di Node con la versione dentro** (`Cellar/node@24/24.20.0`) sarebbe sparito al
  primo aggiornamento di Homebrew: l'app usa quello stabile del PATH (`/opt/homebrew/bin/node`).
- Il browser predefinito del DM è Opera GX, che non installa app web: per lui la strada è
  `npm run app:install`.

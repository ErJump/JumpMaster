# Project Brief

> File stabile. Cambia solo se cambia la natura del progetto.

## In una frase

**JumpMaster** è un'app companion per Dungeon Master di **D&D 5e (regolamento 2014)**, in italiano,
che gira in locale sul PC del DM e lo assiste **durante** la sessione.

## Il problema

Giampiero (GitHub: **ErJump**) sta iniziando a fare da Dungeon Master per la prima volta e non conosce
ancora bene le regole. Condurre una sessione richiede di tenere insieme, in tempo reale e davanti a
quattro persone che aspettano:

- l'ordine di iniziativa e i punti ferita di sei mostri diversi;
- chi è in concentrazione, chi è avvelenato, chi ha fallito due tiri salvezza contro morte;
- regole che non ricorda ("si può fare?");
- il filo della trama, i nomi dei PNG, cosa hanno promesso i giocatori;
- l'improvvisazione quando i giocatori vanno fuori copione.

Gli strumenti esistenti o sono archivi passivi (consultare, non condurre), o sono online a pagamento,
o presuppongono che il DM sappia già le regole.

## L'obiettivo

Un'app che **fa i conti al posto del DM** e **non lo lascia mai bloccato**. Se una feature richiede
di conoscere bene le regole per essere usata, la feature è progettata male.

## Contesto d'uso

- Gira **in locale**, sul PC personale.
- Partite **in presenza** e partite **online con lo schermo condiviso su Discord**.
- Deve funzionare **offline**: se salta il Wi-Fi, il combattimento continua.

## Vincoli fondanti

| Vincolo | Dettaglio |
|---|---|
| Regolamento | D&D **2014** (SRD 5.1), non la revisione 2024 |
| Lingua | UI **italiana**, dati di gioco in inglese, glossario IT↔EN |
| Estetica | **Fantasy**, deve ricordare D&D; leggibile sotto compressione Discord |
| Architettura | **Scalabile a feature**: aggiungerne una = creare una cartella |
| Processo | **Spec-driven** + **memory banking**, con guard rail eseguibili |
| Legale | Solo SRD (CC-BY-4.0) e fonti open. Attribuzione sempre visibile |

## Non-obiettivi (per ora)

- Non è una VTT completa tipo Foundry o Roll20.
- Non gestisce l'account dei giocatori: **l'utente è il DM**, unico ruolo previsto.
- Non importa da D&D Beyond (zona grigia ToS) → import/export JSON generico.
- Non è multi-dispositivo/cloud. Locale, con la porta aperta a ospitarlo in futuro.

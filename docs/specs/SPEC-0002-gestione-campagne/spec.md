---
id: SPEC-0002
slug: gestione-campagne
title: Gestione delle campagne
milestone: M1
status: in-progress
updated: 2026-09-22
---

# SPEC-0002 — Gestione delle campagne

## Perché

La campagna è il contenitore di tutto: personaggi, scontri, note, oggetti. Senza di essa nessuna
altra feature ha un posto dove salvare i dati. Il DM deve poter tenere più campagne in parallelo
(la principale, un one-shot, un esperimento) e passare dall'una all'altra senza confusione.

## Cosa

CRUD delle campagne più il concetto di **campagna attiva**: una sola alla volta, ricordata fra un
avvio e l'altro, mostrata sempre nell'intestazione così il DM sa dove sta scrivendo.

### Dati di una campagna

| Campo | Note |
|---|---|
| `name` | obbligatorio |
| `description` | premessa, tono, ambientazione |
| `setting` | es. "Forgotten Realms", "ambientazione mia" |
| `dmNotes` | appunti privati del DM |
| `partyLevel` | livello medio del gruppo, usato dall'encounter builder in M2 |
| `sessionCount` | quante sessioni giocate |
| `status` | `active` · `paused` · `completed` |
| `createdAt`, `updatedAt` | |

## Criteri di accettazione

- [x] **AC1** — Posso creare una campagna indicando almeno il nome; compare nell'elenco.
- [ ] **AC2** — L'elenco mostra le campagne con nome, ambientazione, livello del gruppo e stato.
- [x] **AC3** — Posso attivare una campagna; resta attiva **anche dopo aver riavviato l'app**.
- [x] **AC4** — La campagna attiva è sempre visibile nell'intestazione.
- [ ] **AC5** — Posso modificare tutti i campi.
- [ ] **AC6** — L'eliminazione **chiede conferma** e mostra cosa verrà cancellato con essa.
- [ ] **AC7** — Senza campagne l'app mostra uno stato vuoto che invita a crearne una, non una pagina bianca.
- [x] **AC8** — Le feature che richiedono una campagna (`requiresCampaign: true`) spiegano che serve
      sceglierne una, invece di rompersi.
- [x] **AC9** — Tutti gli input passano da uno schema Zod; un nome vuoto mostra un errore comprensibile in italiano.

## Fuori ambito

Import/export della campagna (M6). Condivisione coi giocatori (M3).

## Stato della verifica — 2026-09-22

**Verificati nel browser**: creata «La Maledizione di Strahd» dal form, redirect a `/campagne/1`,
diventata **attiva da sola** (nessuna campagna attiva prima), persistita in `campaigns` e
`app_settings` (AC1, AC3, AC4, AC9).

**Da riprovare a mano con più campagne**: AC2 (elenco), AC5 (modifica), AC6 (conferma di
eliminazione), AC7 (stato vuoto). Il codice c'è, ma non li ho ancora provati uno per uno.

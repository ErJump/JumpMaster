# SPEC-0002 — Tasks

- [x] Schema Drizzle `campaigns` + `appSettings`
- [x] Migrazione generata e applicata
- [x] `schema.ts` con Zod e messaggi d'errore in italiano
- [x] `queries.ts`: listCampaigns, getCampaign, getActiveCampaign
- [x] `actions.ts`: create, update, delete, setActive
- [x] Elenco campagne + stato vuoto
- [x] `CampaignForm` (creazione e modifica)
- [x] Conferma di eliminazione con elenco di ciò che sparirà
- [x] Campagna attiva nell'intestazione
- [ ] Guardia per le feature con `requiresCampaign` — nessuna slice di M1 la richiede ancora, serve da M2
- [x] Verifica nel browser: campagna creata, redirect, diventata attiva da sola,
      persistita nel database (AC1, AC3, AC4, AC9)
- [ ] AC2, AC5, AC6, AC7 da riprovare a mano con più campagne

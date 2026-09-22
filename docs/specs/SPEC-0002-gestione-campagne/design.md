# SPEC-0002 — Design

## Schema

```ts
// src/db/schema/campaign.ts
campaigns = {
  id, name, description, setting, dmNotes,
  partyLevel, sessionCount, status, createdAt, updatedAt
}

// Preferenze dell'app: chiave/valore, così la campagna attiva sopravvive al riavvio
// senza dipendere dal browser (l'app può essere aperta in più finestre: DM + Vista Giocatori).
appSettings = { key, value }   // 'activeCampaignId' → '3'
```

**Perché non `localStorage`**: la Vista Giocatori (M3) è una **seconda finestra**. Se la campagna
attiva vivesse nel browser, le due finestre potrebbero divergere. Tenerla nel database la rende una
sola verità per tutto il processo.

## Invariante

Ogni tabella di dominio ha `campaign_id` con foreign key e `ON DELETE CASCADE`. Eliminare una
campagna elimina tutto ciò che le appartiene — da qui l'obbligo di AC6 di mostrare *cosa* sparirà.

## Moduli

```
src/features/campaigns/
  feature.config.ts
  schema.ts       · Zod: createCampaignSchema, updateCampaignSchema
  queries.ts      · listCampaigns, getCampaign, getActiveCampaign
  actions.ts      · createCampaign, updateCampaign, deleteCampaign, setActiveCampaign
  components/     · CampaignList, CampaignForm, CampaignCard, ActiveCampaignBadge
```

`getActiveCampaign()` è usata dal layout: sta in `queries.ts` ed è la sola via per sapere qual è la
campagna corrente.

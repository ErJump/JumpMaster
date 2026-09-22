# SPEC-0007 — Design

## Event sourcing, concretamente

```ts
combatEvents = {
  id, encounterId → ON DELETE CASCADE,
  seq,                    // progressivo per scontro: definisce l'ordine
  type, payload: json,
  undoneAt,               // null = attivo. L'annulla NON cancella (vedi sotto)
  createdAt
}
```

**Perché `undoneAt` invece di cancellare la riga**: il registro resta davvero in sola aggiunta,
l'annulla è reversibile (rifai, se servirà) e in M4 il registro completo diventerà il riassunto
automatico della sessione. Cancellare butterebbe via la storia proprio mentre ADR-0005 sostiene
che la storia è il valore.

Annulla = `undoneAt` sull'evento attivo con `seq` più alto. Un evento nuovo dopo un annulla
**scarta definitivamente** gli eventi annullati in coda (come un editor di testo).

## Riduzione pura

```
src/core/events/
  combat-types.ts   · CombatEvent, CombatState, Combatant
  combat-reduce.ts  · reduceCombat(events) → CombatState
  hit-points.ts     · applyDamage, applyHealing, applyTempHp  ← le regole SRD
  *.test.ts
```

`src/core/events/**` non conosce React, Next né il database (invariante I1). Riceve un array di
eventi e restituisce lo stato. Questo rende testabile la parte che **non può sbagliare**: le regole
dei punti ferita.

```ts
applyDamage(c: Combatant, amount: number, opts: { critical?: boolean }): Combatant
```

Dentro, nell'ordine dettato dall'SRD: assorbimento dei temporanei → riduzione → se arriva a 0,
**danno massiccio?** → altrimenti privo di sensi → se era già a 0, fallimenti (due se critico).

## Stato

```ts
interface Combatant {
  id: string;                      // stabile per tutto il combattimento
  name: string;                    // "Goblin 1"
  kind: 'pc' | 'npc' | 'monster';
  maxHp; currentHp; tempHp; ac;
  initiative: number | null;       // null = non ancora tirata
  initiativeMod: number;
  conditions: string[];
  concentration: { spell: string } | null;
  deathSaves: { successes: number; failures: number };
  status: 'active' | 'unconscious' | 'stable' | 'dead';
  srdMonsterSlug?: string;
  characterId?: number;
}

interface CombatState {
  round: number;
  turnIndex: number;
  combatants: Combatant[];         // ordinati per iniziativa decrescente
  log: LogEntry[];                 // frasi in italiano, già pronte da mostrare
  pendingConcentration: Array<{ combatantId: string; dc: number }>;
}
```

`pendingConcentration` è ciò che rende l'app davvero utile: quando un combattente in concentrazione
subisce danno, il riduttore calcola da sé la CD (10 oppure metà del danno, il maggiore) e la mette
in coda. Il DM vede comparire *«Elara deve tirare un TS su Costituzione con CD 13 o perde
Ragnatela»* senza doversi ricordare né la regola né il conto.

## Ordine di iniziativa

Ordinamento per iniziativa decrescente, a parità per modificatore decrescente, e infine per ordine
di inserimento — così è **deterministico**: senza l'ultimo criterio l'ordine potrebbe cambiare fra
una riduzione e l'altra, e il DM vedrebbe le righe saltare da sole.

`turnIndex` punta nell'array ordinato. Rimuovere un combattente prima del turno corrente sposta
l'indice di conseguenza.

## Interfaccia

Rotta `/combattimento`. Tre colonne su schermo largo:

1. **Ordine di iniziativa** — una riga per combattente. Il turno corrente ha un bordo dorato spesso
   e uno sfondo pieno: deve leggersi **a due metri di distanza**, non con lo sguardo attento.
   Barra dei punti ferita, condizioni come etichette, indicatore di concentrazione.
2. **Combattente selezionato** — danno, cura, temporanei, condizioni, tiri salvezza contro morte,
   e lo stat block completo con gli **attacchi cliccabili** (AC17).
3. **Registro** — cosa è successo, in italiano, con **Annulla** in cima.

Scorciatoie: `Spazio` turno successivo · `Ctrl+Z` annulla · `D` danno · `C` cura · `1-9` seleziona.

### Attacchi cliccabili (AC17)

Il motore dei dadi esiste già da M1. Lo stat block SRD porta `attack_bonus` e
`damage[].damage_dice`: cliccare «Morso» tira `1d20+9`, cliccare il danno tira `2d6+5`, e il
risultato finisce nel registro. È il collegamento fra `core/dice` e `core/events` per cui M1 aveva
preparato il terreno.

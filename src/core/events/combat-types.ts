/** ⚠ Modulo puro (invariante I1): niente React, niente database. */

export type CombatantKind = 'pc' | 'npc' | 'monster';

/**
 * `active` in piedi · `unconscious` a 0 PF con tiri contro morte in corso ·
 * `stable` a 0 PF ma fuori pericolo · `dead` morto.
 */
export type CombatantStatus = 'active' | 'unconscious' | 'stable' | 'dead';

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Combatant {
  /** Stabile per tutta la durata del combattimento. */
  id: string;
  name: string;
  kind: CombatantKind;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  ac: number;
  /** `null` finché l'iniziativa non è stata inserita o tirata. */
  initiative: number | null;
  initiativeMod: number;
  conditions: string[];
  concentration: { spell: string } | null;
  deathSaves: DeathSaves;
  status: CombatantStatus;
  srdMonsterSlug?: string;
  characterId?: number;
}

export type DeathSaveResult = 'success' | 'failure' | 'critical-success' | 'critical-failure';

export type CombatEvent =
  | { type: 'combat-start' }
  | {
      type: 'combatant-add';
      id: string;
      name: string;
      kind: CombatantKind;
      maxHp: number;
      ac: number;
      initiativeMod: number;
      initiative?: number;
      srdMonsterSlug?: string;
      characterId?: number;
    }
  | { type: 'combatant-remove'; id: string }
  | { type: 'initiative-set'; id: string; value: number }
  | { type: 'damage'; id: string; amount: number; critical?: boolean; source?: string }
  | { type: 'heal'; id: string; amount: number }
  | { type: 'temp-hp'; id: string; amount: number }
  | { type: 'condition-add'; id: string; condition: string }
  | { type: 'condition-remove'; id: string; condition: string }
  | { type: 'concentration-set'; id: string; spell: string }
  | { type: 'concentration-break'; id: string }
  | { type: 'death-save'; id: string; result: DeathSaveResult }
  | { type: 'death-save-reset'; id: string }
  | { type: 'turn-next' }
  | { type: 'turn-prev' }
  | { type: 'note'; text: string };

export interface LogEntry {
  /** Frase già pronta da mostrare, in italiano. */
  text: string;
  tone: 'neutral' | 'damage' | 'heal' | 'danger' | 'turn';
}

/** Promemoria che il riduttore mette in coda: il DM non deve ricordarsi né la regola né il conto. */
export interface ConcentrationCheck {
  combatantId: string;
  combatantName: string;
  spell: string;
  dc: number;
}

export interface CombatState {
  started: boolean;
  round: number;
  turnIndex: number;
  /** Ordinati per iniziativa decrescente. */
  combatants: Combatant[];
  log: LogEntry[];
  pendingConcentration: ConcentrationCheck[];
}

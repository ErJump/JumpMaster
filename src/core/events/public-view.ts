/**
 * Ciò che vedono i giocatori — SPEC-0008.
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * `PublicCombatant` è un **tipo diverso** da `Combatant`, non un filtro applicato dopo: i campi
 * riservati (PF esatti dei mostri, CA, stat block) semplicemente non esistono qui. Un dato
 * segreto non può finire nella finestra dei giocatori per distrazione, perché non c'è un campo
 * in cui metterlo.
 */
import type { Combatant, CombatState } from './combat-types';

export type HpBand = 'illeso' | 'ferito' | 'malconcio' | 'in-fin-di-vita' | 'morto';

export const HP_BAND_LABELS: Record<HpBand, string> = {
  illeso: 'Illeso',
  ferito: 'Ferito',
  malconcio: 'Malconcio',
  'in-fin-di-vita': 'In fin di vita',
  morto: 'Morto',
};

/**
 * Descrizione a parole dello stato di un mostro. È ciò che il DM direbbe al tavolo
 * («sembra malconcio»), senza rivelare quanto manca.
 */
export function hpBand(current: number, max: number, status: Combatant['status']): HpBand {
  if (status === 'dead' || current <= 0) return 'morto';
  if (max <= 0 || current >= max) return 'illeso';
  const ratio = current / max;
  if (ratio > 0.5) return 'ferito';
  if (ratio > 0.25) return 'malconcio';
  return 'in-fin-di-vita';
}

interface PublicBase {
  id: string;
  name: string;
  initiative: number | null;
  conditions: string[];
  concentration: string | null;
  /** In scena si vede: chi è a terra, chi è morto. */
  status: Combatant['status'];
}

/** I PG: i loro punti ferita li conoscono già, e il gruppo li vede sul tavolo. */
export interface PublicPc extends PublicBase {
  kind: 'pc';
  currentHp: number;
  maxHp: number;
  tempHp: number;
  deathSaves: { successes: number; failures: number };
}

/** Mostri e PNG: solo la fascia, mai i numeri. */
export interface PublicCreature extends PublicBase {
  kind: 'creature';
  band: HpBand;
}

export type PublicCombatant = PublicPc | PublicCreature;

export interface PublicCombat {
  round: number;
  /** `null` se è il turno di un combattente nascosto: la Vista non deve tradirlo. */
  currentId: string | null;
  combatants: PublicCombatant[];
}

export function toPublicCombat(state: CombatState): PublicCombat {
  const current = state.combatants[state.turnIndex];

  const combatants = state.combatants
    .filter((c) => !c.hidden)
    .map((c): PublicCombatant => {
      const base: PublicBase = {
        id: c.id,
        name: c.name,
        initiative: c.initiative,
        conditions: [...c.conditions],
        concentration: c.concentration?.spell ?? null,
        status: c.status,
      };

      if (c.kind === 'pc') {
        return {
          ...base,
          kind: 'pc',
          currentHp: c.currentHp,
          maxHp: c.maxHp,
          tempHp: c.tempHp,
          deathSaves: { ...c.deathSaves },
        };
      }

      return { ...base, kind: 'creature', band: hpBand(c.currentHp, c.maxHp, c.status) };
    });

  return {
    round: state.round,
    currentId: current && !current.hidden ? current.id : null,
    combatants,
  };
}

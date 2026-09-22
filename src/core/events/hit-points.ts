/**
 * Regole dei punti ferita — SRD 5.1, «Damage and Healing».
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * **È il punto dell'app che non può sbagliare.** Il DM è alle prime armi e queste regole non le
 * conosce: se l'app sbaglia, lui non se ne accorge e un personaggio muore (o sopravvive) quando
 * non doveva. Ogni funzione qui sotto ha test sui casi limite.
 *
 * Tutte restituiscono un **nuovo** combattente: niente mutazioni, così la riduzione degli eventi
 * resta pura e l'annulla funziona ricostruendo lo stato da capo.
 */
import { isMassiveDamage } from '../rules/combat';
import type { Combatant, DeathSaveResult } from './combat-types';

/**
 * I mostri cadono a 0 punti ferita senza tiri salvezza contro morte; i personaggi giocanti no.
 *
 * L'SRD lascia la scelta al DM, ma questa è la prassi di ogni tavolo: nessuno tira i salvezza
 * contro morte per il quarto goblin. Il DM può sempre curare o annullare.
 */
function usesDeathSaves(combatant: Combatant): boolean {
  return combatant.kind === 'pc';
}

const NO_DEATH_SAVES = { successes: 0, failures: 0 } as const;

export interface DamageOutcome {
  combatant: Combatant;
  /** Danno effettivamente assorbito dai punti ferita temporanei. */
  absorbedByTemp: number;
  /** Danno arrivato ai punti ferita veri. */
  appliedToHp: number;
  /** La morte è arrivata per danno massiccio e non per tiri salvezza falliti. */
  instantDeath: boolean;
  /** Il colpo ha portato il combattente a 0 punti ferita adesso. */
  droppedToZero: boolean;
}

/**
 * Applica danno, nell'ordine dettato dall'SRD:
 * temporanei → punti ferita → controllo del danno massiccio → conseguenze dello 0.
 */
export function applyDamage(
  combatant: Combatant,
  amount: number,
  options: { critical?: boolean } = {},
): DamageOutcome {
  const unchanged: DamageOutcome = {
    combatant,
    absorbedByTemp: 0,
    appliedToHp: 0,
    instantDeath: false,
    droppedToZero: false,
  };

  if (amount <= 0 || combatant.status === 'dead') return unchanged;

  // I punti ferita temporanei assorbono per primi.
  const absorbedByTemp = Math.min(combatant.tempHp, amount);
  const remaining = amount - absorbedByTemp;
  const tempHp = combatant.tempHp - absorbedByTemp;

  if (remaining === 0) {
    return { ...unchanged, combatant: { ...combatant, tempHp }, absorbedByTemp };
  }

  // ── Colpito mentre si è già a 0 punti ferita ──────────────────────
  if (combatant.currentHp === 0) {
    // «Se il danno eguaglia o supera i punti ferita massimi, morte istantanea»:
    // vale anche per chi è già a terra.
    if (isMassiveDamage(remaining, combatant.maxHp)) {
      return {
        combatant: { ...combatant, tempHp, status: 'dead', concentration: null },
        absorbedByTemp,
        appliedToHp: remaining,
        instantDeath: true,
        droppedToZero: false,
      };
    }

    if (!usesDeathSaves(combatant)) {
      return {
        combatant: { ...combatant, tempHp, status: 'dead', concentration: null },
        absorbedByTemp,
        appliedToHp: remaining,
        instantDeath: false,
        droppedToZero: false,
      };
    }

    // Un colpo subito a terra costa un fallimento; se è critico, due.
    const failures = combatant.deathSaves.failures + (options.critical ? 2 : 1);
    const dead = failures >= 3;

    return {
      combatant: {
        ...combatant,
        tempHp,
        status: dead ? 'dead' : 'unconscious',
        concentration: null,
        deathSaves: { ...combatant.deathSaves, failures: Math.min(3, failures) },
      },
      absorbedByTemp,
      appliedToHp: remaining,
      instantDeath: false,
      droppedToZero: false,
    };
  }

  // ── Colpito mentre si è ancora in piedi ───────────────────────────
  const newHp = combatant.currentHp - remaining;

  if (newHp > 0) {
    return {
      combatant: { ...combatant, tempHp, currentHp: newHp },
      absorbedByTemp,
      appliedToHp: remaining,
      instantDeath: false,
      droppedToZero: false,
    };
  }

  // Sceso a 0: il danno in eccesso decide se è svenimento o morte.
  const overflow = -newHp;

  if (isMassiveDamage(overflow, combatant.maxHp)) {
    return {
      combatant: { ...combatant, tempHp, currentHp: 0, status: 'dead', concentration: null },
      absorbedByTemp,
      appliedToHp: remaining,
      instantDeath: true,
      droppedToZero: true,
    };
  }

  return {
    combatant: {
      ...combatant,
      tempHp,
      currentHp: 0,
      // La concentrazione si perde comunque quando si cade a 0.
      concentration: null,
      status: usesDeathSaves(combatant) ? 'unconscious' : 'dead',
      deathSaves: { ...NO_DEATH_SAVES },
    },
    absorbedByTemp,
    appliedToHp: remaining,
    instantDeath: false,
    droppedToZero: true,
  };
}

/**
 * Applica cure. Qualunque cura sopra 0 riporta coscienza e **azzera i tiri salvezza contro morte**.
 *
 * Un morto non si cura con la magia ordinaria: serve resurrezione. Se il DM ha sbagliato,
 * ha l'annulla.
 */
export function applyHealing(combatant: Combatant, amount: number): { combatant: Combatant; revived: boolean } {
  if (amount <= 0 || combatant.status === 'dead') return { combatant, revived: false };

  const currentHp = Math.min(combatant.maxHp, combatant.currentHp + amount);
  const revived = combatant.currentHp === 0 && currentHp > 0;

  return {
    combatant: {
      ...combatant,
      currentHp,
      status: 'active',
      deathSaves: revived ? { ...NO_DEATH_SAVES } : combatant.deathSaves,
    },
    revived,
  };
}

/** I punti ferita temporanei **non si sommano**: si tiene il valore più alto. */
export function applyTempHp(combatant: Combatant, amount: number): Combatant {
  if (amount <= 0) return combatant;
  return { ...combatant, tempHp: Math.max(combatant.tempHp, amount) };
}

export interface DeathSaveOutcome {
  combatant: Combatant;
  stabilized: boolean;
  died: boolean;
  /** Il 20 naturale non stabilizza: rimette in piedi con 1 punto ferita. */
  revivedByNatural20: boolean;
}

/**
 * Registra un tiro salvezza contro morte.
 *
 * Un 20 naturale riporta a 1 punto ferita; un 1 naturale vale **due** fallimenti.
 * Tre successi stabilizzano, tre fallimenti uccidono.
 */
export function applyDeathSave(combatant: Combatant, result: DeathSaveResult): DeathSaveOutcome {
  const unchanged: DeathSaveOutcome = {
    combatant,
    stabilized: false,
    died: false,
    revivedByNatural20: false,
  };

  if (combatant.status !== 'unconscious') return unchanged;

  if (result === 'critical-success') {
    return {
      combatant: { ...combatant, currentHp: 1, status: 'active', deathSaves: { ...NO_DEATH_SAVES } },
      stabilized: false,
      died: false,
      revivedByNatural20: true,
    };
  }

  const successes = combatant.deathSaves.successes + (result === 'success' ? 1 : 0);
  const failures = combatant.deathSaves.failures + (result === 'failure' ? 1 : result === 'critical-failure' ? 2 : 0);

  if (failures >= 3) {
    return {
      combatant: { ...combatant, status: 'dead', deathSaves: { successes, failures: 3 } },
      stabilized: false,
      died: true,
      revivedByNatural20: false,
    };
  }

  if (successes >= 3) {
    return {
      combatant: { ...combatant, status: 'stable', deathSaves: { ...NO_DEATH_SAVES } },
      stabilized: true,
      died: false,
      revivedByNatural20: false,
    };
  }

  return {
    combatant: { ...combatant, deathSaves: { successes, failures } },
    stabilized: false,
    died: false,
    revivedByNatural20: false,
  };
}

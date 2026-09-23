/**
 * Riduzione degli eventi di combattimento a stato corrente.
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * Il combattimento non memorizza uno stato mutabile: memorizza **cosa è successo**, e lo stato
 * è la riduzione di quegli eventi (ADR-0005). Da qui l'annulla arriva gratis: basta ridurre
 * un evento in meno.
 */
import { concentrationDc } from '../rules/combat';
import { applyDamage, applyHealing, applyTempHp, applyDeathSave } from './hit-points';
import type {
  Combatant,
  CombatEvent,
  CombatState,
  ConcentrationCheck,
  LogEntry,
} from './combat-types';

const EMPTY_STATE: CombatState = {
  started: false,
  round: 1,
  turnIndex: 0,
  combatants: [],
  log: [],
  pendingConcentration: [],
};

/**
 * Ordine di iniziativa: decrescente, a parità il modificatore più alto, e infine l'ordine di
 * inserimento.
 *
 * L'ultimo criterio non è un dettaglio: senza, due combattenti con stessa iniziativa e stesso
 * modificatore potrebbero scambiarsi di posto fra una riduzione e l'altra, e il DM vedrebbe le
 * righe saltare da sole mentre gioca.
 */
function sortCombatants(combatants: Combatant[], insertionOrder: Map<string, number>): Combatant[] {
  return [...combatants].sort((a, b) => {
    // Chi non ha ancora tirato l'iniziativa va in fondo.
    if (a.initiative === null && b.initiative !== null) return 1;
    if (b.initiative === null && a.initiative !== null) return -1;
    if (a.initiative !== null && b.initiative !== null && a.initiative !== b.initiative) {
      return b.initiative - a.initiative;
    }
    if (a.initiativeMod !== b.initiativeMod) return b.initiativeMod - a.initiativeMod;
    return (insertionOrder.get(a.id) ?? 0) - (insertionOrder.get(b.id) ?? 0);
  });
}

export function reduceCombat(events: readonly CombatEvent[]): CombatState {
  let started = false;
  let round = 1;
  let turnIndex = 0;
  let combatants: Combatant[] = [];
  let pendingConcentration: ConcentrationCheck[] = [];
  const log: LogEntry[] = [];
  const insertionOrder = new Map<string, number>();

  const say = (text: string, tone: LogEntry['tone'] = 'neutral') => log.push({ text, tone });

  /** Sostituisce un combattente lasciando gli altri intatti. */
  const replace = (id: string, next: Combatant) => {
    combatants = combatants.map((c) => (c.id === id ? next : c));
  };

  const find = (id: string) => combatants.find((c) => c.id === id);

  for (const event of events) {
    switch (event.type) {
      case 'combat-start': {
        started = true;
        say('Il combattimento comincia.', 'turn');
        break;
      }

      case 'combatant-add': {
        if (find(event.id)) break; // già presente: ignora invece di duplicare
        insertionOrder.set(event.id, insertionOrder.size);
        combatants = [
          ...combatants,
          {
            id: event.id,
            name: event.name,
            kind: event.kind,
            maxHp: event.maxHp,
            currentHp: event.maxHp,
            tempHp: 0,
            ac: event.ac,
            initiative: event.initiative ?? null,
            initiativeMod: event.initiativeMod,
            conditions: [],
            concentration: null,
            deathSaves: { successes: 0, failures: 0 },
            status: 'active',
            ...(event.srdMonsterSlug ? { srdMonsterSlug: event.srdMonsterSlug } : {}),
            ...(event.characterId !== undefined ? { characterId: event.characterId } : {}),
          },
        ];
        break;
      }

      case 'combatant-remove': {
        const sorted = sortCombatants(combatants, insertionOrder);
        const position = sorted.findIndex((c) => c.id === event.id);
        const target = find(event.id);
        combatants = combatants.filter((c) => c.id !== event.id);
        pendingConcentration = pendingConcentration.filter((check) => check.combatantId !== event.id);

        // Se se ne va qualcuno che veniva prima nel giro, l'indice del turno
        // punterebbe alla riga sbagliata.
        if (position !== -1 && position < turnIndex) turnIndex--;
        if (turnIndex >= combatants.length) turnIndex = 0;

        if (target) say(`${target.name} esce dal combattimento.`);
        break;
      }

      case 'initiative-set': {
        const target = find(event.id);
        if (!target) break;
        replace(event.id, { ...target, initiative: event.value });
        break;
      }

      case 'damage': {
        const target = find(event.id);
        if (!target) break;

        const hadConcentration = target.concentration;
        const outcome = applyDamage(target, event.amount, { critical: event.critical });
        replace(event.id, outcome.combatant);

        const source = event.source ? ` (${event.source})` : '';
        say(
          `${target.name} subisce ${event.amount} danni${event.critical ? ' — colpo critico' : ''}${source}.`,
          'damage',
        );

        if (outcome.absorbedByTemp > 0) {
          say(`${outcome.absorbedByTemp} assorbiti dai punti ferita temporanei.`);
        }

        if (outcome.instantDeath) {
          say(
            `${target.name} muore all'istante: il danno residuo eguaglia o supera i suoi punti ferita massimi.`,
            'danger',
          );
        } else if (outcome.combatant.status === 'dead') {
          say(`${target.name} muore.`, 'danger');
        } else if (outcome.droppedToZero) {
          say(`${target.name} cade a 0 punti ferita.`, 'danger');
        } else if (target.currentHp === 0) {
          say(
            `${target.name} è stato colpito mentre era a terra: ${event.critical ? 'due fallimenti' : 'un fallimento'} ai tiri salvezza contro morte.`,
            'danger',
          );
        }

        // Il promemoria della concentrazione, con la CD già calcolata: è una delle regole
        // che un DM alle prime armi dimentica sistematicamente.
        if (hadConcentration && outcome.combatant.concentration) {
          pendingConcentration = [
            ...pendingConcentration.filter((check) => check.combatantId !== event.id),
            {
              combatantId: event.id,
              combatantName: target.name,
              spell: hadConcentration.spell,
              dc: concentrationDc(event.amount),
            },
          ];
        } else if (hadConcentration && !outcome.combatant.concentration) {
          say(`${target.name} perde la concentrazione su ${hadConcentration.spell}.`, 'danger');
        }
        break;
      }

      case 'heal': {
        const target = find(event.id);
        if (!target) break;
        const outcome = applyHealing(target, event.amount);
        replace(event.id, outcome.combatant);
        say(`${target.name} recupera ${event.amount} punti ferita.`, 'heal');
        if (outcome.revived) say(`${target.name} riprende conoscenza.`, 'heal');
        break;
      }

      case 'temp-hp': {
        const target = find(event.id);
        if (!target) break;
        const next = applyTempHp(target, event.amount);
        replace(event.id, next);
        say(
          next.tempHp === event.amount
            ? `${target.name} guadagna ${event.amount} punti ferita temporanei.`
            : `${target.name} ha già ${target.tempHp} punti ferita temporanei: non si sommano, resta il valore più alto.`,
          'heal',
        );
        break;
      }

      case 'condition-add': {
        const target = find(event.id);
        if (!target || target.conditions.includes(event.condition)) break;
        replace(event.id, { ...target, conditions: [...target.conditions, event.condition] });
        say(`${target.name}: ${event.condition}.`);
        break;
      }

      case 'condition-remove': {
        const target = find(event.id);
        if (!target) break;
        replace(event.id, {
          ...target,
          conditions: target.conditions.filter((condition) => condition !== event.condition),
        });
        say(`${target.name} non è più ${event.condition}.`);
        break;
      }

      case 'concentration-set': {
        const target = find(event.id);
        if (!target) break;
        replace(event.id, { ...target, concentration: { spell: event.spell } });
        say(`${target.name} si concentra su ${event.spell}.`);
        break;
      }

      case 'concentration-break': {
        const target = find(event.id);
        if (!target) break;
        replace(event.id, { ...target, concentration: null });
        pendingConcentration = pendingConcentration.filter((check) => check.combatantId !== event.id);
        if (target.concentration) say(`${target.name} perde la concentrazione su ${target.concentration.spell}.`);
        break;
      }

      case 'concentration-kept': {
        const target = find(event.id);
        if (!target) break;
        const check = pendingConcentration.find((entry) => entry.combatantId === event.id);
        pendingConcentration = pendingConcentration.filter((entry) => entry.combatantId !== event.id);
        if (check) say(`${target.name} supera il tiro salvezza e mantiene la concentrazione su ${check.spell}.`);
        break;
      }

      case 'death-save': {
        const target = find(event.id);
        if (!target) break;
        const outcome = applyDeathSave(target, event.result);
        replace(event.id, outcome.combatant);

        if (outcome.revivedByNatural20) {
          say(`${target.name} tira 20 naturale e torna in piedi con 1 punto ferita.`, 'heal');
        } else if (outcome.died) {
          say(`${target.name} muore: tre tiri salvezza contro morte falliti.`, 'danger');
        } else if (outcome.stabilized) {
          say(`${target.name} si stabilizza.`, 'heal');
        } else if (event.result === 'critical-failure') {
          say(`${target.name} tira 1 naturale: due fallimenti.`, 'danger');
        } else {
          say(`${target.name}: tiro salvezza contro morte ${event.result === 'success' ? 'riuscito' : 'fallito'}.`);
        }
        break;
      }

      case 'death-save-reset': {
        const target = find(event.id);
        if (!target) break;
        replace(event.id, { ...target, deathSaves: { successes: 0, failures: 0 } });
        break;
      }

      case 'turn-next': {
        // Il promemoria della concentrazione vale per il momento in cui è nato: passato il
        // turno, la prova o è stata fatta o non si fa più.
        pendingConcentration = [];
        const sorted = sortCombatants(combatants, insertionOrder);
        if (sorted.length === 0) break;

        // I morti non hanno turno: nessun DM vuole fermarsi sul Goblin 3 già ucciso.
        // Chi è privo di sensi invece sì — nel suo turno tira i salvezza contro morte.
        for (let step = 0; step < sorted.length; step++) {
          turnIndex++;
          if (turnIndex >= sorted.length) {
            turnIndex = 0;
            round++;
            say(`Round ${round}.`, 'turn');
          }
          if (sorted[turnIndex]?.status !== 'dead') break;
        }
        break;
      }

      case 'turn-prev': {
        pendingConcentration = [];
        const sorted = sortCombatants(combatants, insertionOrder);
        if (sorted.length === 0) break;

        for (let step = 0; step < sorted.length; step++) {
          turnIndex--;
          if (turnIndex < 0) {
            turnIndex = sorted.length - 1;
            round = Math.max(1, round - 1);
          }
          if (sorted[turnIndex]?.status !== 'dead') break;
        }
        break;
      }

      case 'note': {
        say(event.text);
        break;
      }
    }
  }

  const sorted = sortCombatants(combatants, insertionOrder);

  return {
    ...EMPTY_STATE,
    started,
    round,
    turnIndex: sorted.length === 0 ? 0 : Math.min(turnIndex, sorted.length - 1),
    combatants: sorted,
    log,
    pendingConcentration,
  };
}

/** Il combattente di turno, se il combattimento è cominciato. */
export function currentCombatant(state: CombatState): Combatant | undefined {
  return state.combatants[state.turnIndex];
}

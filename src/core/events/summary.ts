/**
 * Riassunto di un combattimento per il diario della sessione — SPEC-0010 AC7.
 *
 * ⚠ Modulo puro (invariante I1).
 *
 * È la promessa di ADR-0005: il registro degli eventi diventa, gratis, il ricordo di cosa è
 * successo. Frasi in italiano, pronte da incollare nel diario.
 */
import type { CombatState, Combatant } from './combat-types';

/** «Goblin 3» → «Goblin»: i mostri numerati si raggruppano nel riassunto. */
function baseName(name: string): string {
  return name.replace(/\s+\d+$/, '');
}

/** «4 Goblin, Ogre» — raggruppa le copie dello stesso mostro. */
function groupNames(combatants: Combatant[]): string {
  const counts = new Map<string, number>();
  for (const c of combatants) counts.set(baseName(c.name), (counts.get(baseName(c.name)) ?? 0) + 1);
  return [...counts.entries()].map(([name, n]) => (n > 1 ? `${n} ${name}` : name)).join(', ');
}

export function summarizeCombat(state: CombatState, title: string): string {
  const monsters = state.combatants.filter((c) => c.kind !== 'pc');
  const pcs = state.combatants.filter((c) => c.kind === 'pc');
  const downed = new Set(state.everDowned);

  const defeated = monsters.filter((c) => c.status === 'dead');
  const standing = monsters.filter((c) => c.status !== 'dead');
  const pcsDead = pcs.filter((c) => c.status === 'dead');
  const pcsDownedAndBack = pcs.filter((c) => downed.has(c.id) && c.status === 'active');
  const pcsStillDown = pcs.filter((c) => c.status === 'unconscious' || c.status === 'stable');

  const lines = [`### Scontro: ${title}`, '', `- ${state.round === 1 ? '1 round' : `${state.round} round`}.`];

  if (defeated.length > 0) lines.push(`- Sconfitti: ${groupNames(defeated)}.`);
  if (standing.length > 0) lines.push(`- Ancora in piedi alla fine: ${groupNames(standing)}.`);
  if (pcsDownedAndBack.length > 0) {
    lines.push(`- Caduti a terra e poi rialzati: ${pcsDownedAndBack.map((c) => c.name).join(', ')}.`);
  }
  if (pcsStillDown.length > 0) lines.push(`- A terra alla fine: ${pcsStillDown.map((c) => c.name).join(', ')}.`);
  if (pcsDead.length > 0) lines.push(`- **Morti**: ${pcsDead.map((c) => c.name).join(', ')}.`);
  // `everDowned` contiene anche i mostri uccisi: qui contano solo i personaggi giocanti.
  if (pcs.length > 0 && pcs.every((c) => !downed.has(c.id))) {
    lines.push('- Nessun personaggio è caduto.');
  }

  return lines.join('\n');
}

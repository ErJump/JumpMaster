/**
 * Formule di combattimento. ⚠ Modulo puro (invariante I1).
 *
 * Riferimento: SRD 5.1, «The Order of Combat», «Damage and Healing», «Casting a Spell».
 */

/**
 * Classe Difficoltà del tiro salvezza su Costituzione per mantenere la concentrazione:
 * **10, oppure metà del danno subito, il maggiore dei due**.
 *
 * È una delle regole che un DM alle prime armi dimentica sistematicamente, e dimenticarla
 * regala ai giocatori incantesimi che avrebbero dovuto perdere.
 */
export function concentrationDc(damage: number): number {
  return Math.max(10, Math.floor(Math.max(0, damage) / 2));
}

/**
 * Soglia di morte istantanea: se il danno residuo eguaglia o supera i punti ferita massimi,
 * non c'è tiro salvezza che tenga.
 */
export function isMassiveDamage(remainingDamage: number, maxHp: number): boolean {
  return maxHp > 0 && remainingDamage >= maxHp;
}

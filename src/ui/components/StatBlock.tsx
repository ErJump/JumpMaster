/**
 * Blocco delle statistiche di un mostro, impaginato come sul Monster Manual:
 * barra e filetti color ceralacca, maiuscoletto, tabella delle sei caratteristiche.
 *
 * I modificatori NON sono scritti nei dati: li calcola `core/rules` (SPEC-0003 AC8).
 * È l'unico modo per garantire che il numero mostrato qui sia lo stesso che userà
 * il combat tracker in M2.
 */
import { ABILITIES, ABILITY_LABELS, abilityModifier, formatModifier, proficiencyBonusForCr, crLabel } from '@/core/rules';
import {
  formatSpeed,
  formatSenses,
  formatRefList,
  splitProficiencies,
  formatArmorClass,
  formatHitPoints,
} from '@/lib/srd-format';
import type { SrdAction, SrdMonsterData } from '@/lib/srd-types';

const ABILITY_KEY: Record<(typeof ABILITIES)[number], keyof SrdMonsterData> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};

export function StatBlock({ monster }: { monster: SrdMonsterData }) {
  const { savingThrows, skills } = splitProficiencies(monster.proficiencies);
  const proficiency = monster.proficiency_bonus ?? proficiencyBonusForCr(monster.challenge_rating);

  const subtitle = [
    monster.size,
    monster.subtype ? `${monster.type} (${monster.subtype})` : monster.type,
  ]
    .join(' ')
    .concat(monster.alignment ? `, ${monster.alignment}` : '');

  return (
    <article className="panel border-l-wax overflow-hidden border-l-4">
      <div className="px-6 py-5">
        <h2 className="text-wax text-3xl leading-tight">{monster.name}</h2>
        <p className="text-ink-soft text-lg italic">{subtitle}</p>
      </div>

      <Divider />

      <section className="space-y-1 px-6 py-4">
        <Line label="Classe Armatura">{formatArmorClass(monster.armor_class)}</Line>
        <Line label="Punti Ferita">{formatHitPoints(monster.hit_points, monster.hit_points_roll)}</Line>
        <Line label="Velocità">{formatSpeed(monster.speed)}</Line>
      </section>

      <Divider />

      <table className="w-full px-6 py-4 text-center">
        <thead>
          <tr>
            {ABILITIES.map((ability) => (
              <th key={ability} className="small-caps text-wax pt-4 pb-1 text-base font-semibold">
                <abbr title={ABILITY_LABELS[ability].it} className="no-underline">
                  {ABILITY_LABELS[ability].short}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {ABILITIES.map((ability) => {
              const score = monster[ABILITY_KEY[ability]] as number;
              return (
                <td key={ability} className="text-ink pb-4 font-mono text-base tabular-nums">
                  {score} <span className="text-ink-soft">({formatModifier(abilityModifier(score))})</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      <Divider />

      <section className="space-y-1 px-6 py-4">
        {savingThrows && <Line label="Tiri Salvezza">{savingThrows}</Line>}
        {skills && <Line label="Abilità">{skills}</Line>}
        {monster.damage_vulnerabilities.length > 0 && (
          <Line label="Vulnerabilità ai Danni">{monster.damage_vulnerabilities.join(', ')}</Line>
        )}
        {monster.damage_resistances.length > 0 && (
          <Line label="Resistenze ai Danni">{monster.damage_resistances.join(', ')}</Line>
        )}
        {monster.damage_immunities.length > 0 && (
          <Line label="Immunità ai Danni">{monster.damage_immunities.join(', ')}</Line>
        )}
        {monster.condition_immunities.length > 0 && (
          <Line label="Immunità alle Condizioni">{formatRefList(monster.condition_immunities)}</Line>
        )}
        <Line label="Sensi">{formatSenses(monster.senses)}</Line>
        <Line label="Linguaggi">{monster.languages || '—'}</Line>
        <Line label="Grado di Sfida">
          {crLabel(monster.challenge_rating)}{' '}
          <span className="text-ink-soft">({monster.xp.toLocaleString('it-IT')} PE)</span>
        </Line>
        <Line label="Bonus di Competenza">{formatModifier(proficiency)}</Line>
      </section>

      {monster.special_abilities && monster.special_abilities.length > 0 && (
        <>
          <Divider />
          <section className="space-y-3 px-6 py-4">
            {monster.special_abilities.map((ability) => (
              <ActionEntry key={ability.name} action={ability} />
            ))}
          </section>
        </>
      )}

      <ActionGroup title="Azioni" actions={monster.actions} />
      <ActionGroup title="Reazioni" actions={monster.reactions} />
      <ActionGroup
        title="Azioni Leggendarie"
        actions={monster.legendary_actions}
        note={`${monster.name} può compiere 3 azioni leggendarie, scegliendo fra le opzioni seguenti. Si può usare una sola azione leggendaria alla volta e solo alla fine del turno di un'altra creatura.`}
      />
    </article>
  );
}

function Divider() {
  return <hr className="via-wax from-wax/20 to-wax/20 h-0.5 border-0 bg-gradient-to-r" />;
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-ink text-base leading-relaxed">
      <span className="small-caps text-wax font-semibold">{label}</span> {children}
    </p>
  );
}

function ActionGroup({
  title,
  actions,
  note,
}: {
  title: string;
  actions: SrdAction[] | undefined;
  note?: string;
}) {
  if (!actions || actions.length === 0) return null;

  return (
    <section className="px-6 py-4">
      <h3 className="text-wax border-b-wax/40 small-caps mb-3 border-b pb-1 text-xl">{title}</h3>
      {note && <p className="text-ink-soft mb-3 text-base leading-relaxed">{note}</p>}
      <div className="space-y-3">
        {actions.map((action) => (
          <ActionEntry key={action.name} action={action} />
        ))}
      </div>
    </section>
  );
}

function ActionEntry({ action }: { action: SrdAction }) {
  // Dadi e bonus in monospazio: si leggono a colpo d'occhio e sono già pronti
  // a diventare cliccabili col motore di `core/dice` in M2.
  const attack = action.attack_bonus !== undefined ? `${formatModifier(action.attack_bonus)} al tiro per colpire` : null;
  const damage = (action.damage ?? [])
    .filter((entry) => entry.damage_dice)
    .map((entry) => `${entry.damage_dice} ${entry.damage_type?.name ?? ''}`.trim());

  return (
    <div className="text-ink text-base leading-relaxed">
      <p>
        <strong className="text-ink font-semibold italic">{action.name}.</strong> {action.desc}
      </p>
      {(attack || damage.length > 0) && (
        <p className="text-ink-faint mt-0.5 font-mono text-sm">
          {[attack, ...damage].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}

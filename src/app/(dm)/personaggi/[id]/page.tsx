import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Panel, Badge, DetailRow } from '@/ui/components/primitives';
import { Button } from '@/ui/components/Button';
import { CharacterForm } from '@/features/characters/components/CharacterForm';
import { updateCharacter, deleteCharacter } from '@/features/characters/actions';
import { getCharacter } from '@/features/characters/queries';
import { deriveCharacter } from '@/features/characters/derive';
import { DISPOSITION_LABELS } from '@/features/characters/schema';
import { ABILITIES, ABILITY_LABELS, formatModifier, SKILL_INFO } from '@/core/rules';

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const characterId = Number(id);
  if (!Number.isInteger(characterId)) notFound();

  const character = getCharacter(characterId);
  if (!character) notFound();

  const updateThis = updateCharacter.bind(null, characterId);
  const deleteThis = deleteCharacter.bind(null, characterId);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title={character.name}
        subtitle={
          character.kind === 'pc'
            ? [character.race, character.className, character.subclass, `livello ${character.level}`]
                .filter(Boolean)
                .join(' · ')
            : [character.role, character.location].filter(Boolean).join(' · ') || undefined
        }
      />

      {character.kind === 'pc' ? <PcSummary characterId={characterId} /> : <NpcSummary character={character} />}

      <Panel className="mt-8 p-6">
        <CharacterForm
          action={updateThis}
          kind={character.kind}
          character={character}
          submitLabel="Salva le modifiche"
        />
      </Panel>

      <div className="mt-10">
        <h2 className="small-caps text-ink-faint mb-3 text-base font-semibold">Zona pericolosa</h2>
        <form action={deleteThis}>
          <Button type="submit" variant="danger">
            Elimina la scheda
          </Button>
        </form>
      </div>
    </div>
  );
}

/** Ciò che l'app calcola: il DM non lo digita, lo legge. */
function PcSummary({ characterId }: { characterId: number }) {
  const character = getCharacter(characterId);
  if (!character) return null;
  const { modifiers, saves, passives, initiative, proficiencyBonus, skills } = deriveCharacter(character);

  const trainedSkills = skills.filter((entry) => entry.proficiency !== 'none');

  return (
    <Panel className="border-l-gold border-l-4 p-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="gold">CA {character.ac}</Badge>
        <Badge>{character.maxHp} PF</Badge>
        <Badge>Velocità {character.speed}</Badge>
        <Badge tone="bottle">Iniziativa {formatModifier(initiative)}</Badge>
        <Badge tone="arcane">Competenza {formatModifier(proficiencyBonus)}</Badge>
      </div>

      <table className="mb-4 w-full text-center">
        <thead>
          <tr>
            {ABILITIES.map((ability) => (
              <th key={ability} className="small-caps text-gold pb-1 text-base font-semibold">
                <abbr title={ABILITY_LABELS[ability].it} className="no-underline">
                  {ABILITY_LABELS[ability].short}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {ABILITIES.map((ability) => (
              <td key={ability} className="text-ink pb-2 font-mono text-lg tabular-nums">
                {character[ability]} <span className="text-ink-soft">({formatModifier(modifiers[ability])})</span>
              </td>
            ))}
          </tr>
          <tr>
            {ABILITIES.map((ability) => (
              <td key={ability} className="pb-1 font-mono text-base tabular-nums">
                <span className={saves[ability].proficient ? 'text-gold font-bold' : 'text-ink-faint'}>
                  TS {formatModifier(saves[ability].value)}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <hr className="rule-gold my-4" />

      <div className="space-y-1">
        <DetailRow label="Percezione passiva">{passives.perception}</DetailRow>
        <DetailRow label="Indagare passiva">{passives.investigation}</DetailRow>
        <DetailRow label="Intuizione passiva">{passives.insight}</DetailRow>
        {trainedSkills.length > 0 && (
          <DetailRow label="Abilità">
            {trainedSkills
              .map(
                (entry) =>
                  `${SKILL_INFO[entry.skill].it} ${formatModifier(entry.bonus)}${entry.proficiency === 'expertise' ? '★' : ''}`,
              )
              .join(', ')}
          </DetailRow>
        )}
      </div>
      <p className="text-ink-faint mt-3 text-sm">★ esperienza — il bonus di competenza conta doppio.</p>
    </Panel>
  );
}

function NpcSummary({ character }: { character: NonNullable<ReturnType<typeof getCharacter>> }) {
  return (
    <div className="space-y-4">
      <Panel className="p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge>{DISPOSITION_LABELS[character.disposition]}</Badge>
          {character.srdMonsterSlug && (
            <Link href={`/bestiario/${character.srdMonsterSlug}`}>
              <Badge tone="wax">Stat block: {character.srdMonsterSlug}</Badge>
            </Link>
          )}
        </div>
        {character.appearance && <DetailRow label="Aspetto">{character.appearance}</DetailRow>}
        {character.voice && <DetailRow label="Voce e modi">{character.voice}</DetailRow>}
      </Panel>

      {character.secret && (
        <Panel className="border-l-wax border-l-4 p-6">
          <p className="small-caps text-wax mb-1 text-base font-semibold">⚠️ Segreto — solo per te</p>
          <p className="text-ink leading-relaxed">{character.secret}</p>
        </Panel>
      )}
    </div>
  );
}

import { notFound } from 'next/navigation';
import { Panel, Badge, DetailRow, SrdAttribution } from '@/ui/components/primitives';
import { getSpell } from '@/features/spells/queries';

export default async function SpellPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spell = getSpell(slug);
  if (!spell) notFound();

  const { data } = spell;

  return (
    <div className="max-w-3xl">
      <Panel className="border-l-arcane border-l-4 p-6">
        <h2 className="text-arcane text-3xl leading-tight">{spell.name}</h2>
        <p className="text-ink-soft text-lg italic">
          {spell.levelLabel} · {spell.school}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {spell.concentration && <Badge tone="gold">Concentrazione</Badge>}
          {spell.ritual && <Badge tone="bottle">Rituale</Badge>}
          {spell.classes && <Badge>{spell.classes}</Badge>}
        </div>

        <hr className="rule-gold my-4" />

        <div className="space-y-1">
          <DetailRow label="Tempo di lancio">{spell.castingTime}</DetailRow>
          <DetailRow label="Gittata">{spell.range}</DetailRow>
          <DetailRow label="Componenti">
            {spell.components}
            {data.material && <span className="text-ink-soft"> ({data.material})</span>}
          </DetailRow>
          <DetailRow label="Durata">{spell.duration}</DetailRow>
        </div>

        <hr className="rule-gold my-4" />

        <div className="text-ink space-y-3 leading-relaxed">
          {data.desc.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {data.higher_level && data.higher_level.length > 0 && (
          <div className="border-gold-soft/40 mt-4 border-t pt-4">
            <h3 className="small-caps text-gold mb-1 text-lg">Ai livelli superiori</h3>
            {data.higher_level.map((paragraph, index) => (
              <p key={index} className="text-ink leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </Panel>
      <SrdAttribution className="mt-6" />
    </div>
  );
}

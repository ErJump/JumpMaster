import { notFound } from 'next/navigation';
import { Panel, Badge, DetailRow, SrdAttribution } from '@/ui/components/primitives';
import { formatRefList } from '@/lib/srd-format';
import { getItem } from '@/features/items/queries';

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) notFound();

  if (item.kind === 'magico') {
    return (
      <div className="max-w-3xl">
        <Panel className="border-l-gold border-l-4 p-6">
          <h2 className="text-gold text-3xl leading-tight">{item.name}</h2>
          <p className="text-ink-soft text-lg italic">{item.category}</p>
          <div className="mt-3">
            <Badge tone="gold">{item.rarity}</Badge>
          </div>
          <hr className="rule-gold my-4" />
          <div className="text-ink space-y-3 leading-relaxed">
            {item.data.desc.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </Panel>
        <SrdAttribution className="mt-6" />
      </div>
    );
  }

  const { data } = item;
  const cost = data.cost ? `${data.cost.quantity} ${data.cost.unit}` : '—';

  return (
    <div className="max-w-3xl">
      <Panel className="border-l-border-strong border-l-4 p-6">
        <h2 className="text-ink text-3xl leading-tight">{item.name}</h2>
        <p className="text-ink-soft text-lg italic">{data.category_range ?? item.category}</p>

        <hr className="rule-gold my-4" />

        <div className="space-y-1">
          <DetailRow label="Costo">{cost}</DetailRow>
          {data.weight !== undefined && <DetailRow label="Peso">{data.weight} lb.</DetailRow>}
          {data.damage?.damage_dice && (
            <DetailRow label="Danno">
              <span className="font-mono">{data.damage.damage_dice}</span> {data.damage.damage_type?.name}
            </DetailRow>
          )}
          {data.two_handed_damage?.damage_dice && (
            <DetailRow label="Danno a due mani">
              <span className="font-mono">{data.two_handed_damage.damage_dice}</span>{' '}
              {data.two_handed_damage.damage_type?.name}
            </DetailRow>
          )}
          {data.range?.normal !== undefined && (
            <DetailRow label="Gittata">
              {data.range.normal}
              {data.range.long ? `/${data.range.long}` : ''} ft.
            </DetailRow>
          )}
          {data.armor_class && (
            <DetailRow label="Classe Armatura">
              {data.armor_class.base}
              {data.armor_class.dex_bonus ? ' + mod. Destrezza' : ''}
              {data.armor_class.max_bonus ? ` (max ${data.armor_class.max_bonus})` : ''}
            </DetailRow>
          )}
          {data.str_minimum ? <DetailRow label="Forza minima">{data.str_minimum}</DetailRow> : null}
          {data.stealth_disadvantage && <DetailRow label="Furtività">svantaggio</DetailRow>}
          {data.properties && data.properties.length > 0 && (
            <DetailRow label="Proprietà">{formatRefList(data.properties)}</DetailRow>
          )}
        </div>

        {data.desc && data.desc.length > 0 && (
          <>
            <hr className="rule-gold my-4" />
            <div className="text-ink space-y-2 leading-relaxed">
              {data.desc.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </>
        )}
      </Panel>
      <SrdAttribution className="mt-6" />
    </div>
  );
}

import { notFound } from 'next/navigation';
import { StatBlock } from '@/ui/components/StatBlock';
import { SrdAttribution } from '@/ui/components/primitives';
import { getMonster } from '@/features/bestiary/queries';

export default async function MonsterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const monster = getMonster(slug);
  if (!monster) notFound();

  return (
    <div className="max-w-3xl">
      <StatBlock monster={monster.data} />
      <SrdAttribution className="mt-6" />
    </div>
  );
}

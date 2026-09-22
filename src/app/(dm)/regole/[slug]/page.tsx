import { notFound } from 'next/navigation';
import { Panel, Badge, SrdAttribution } from '@/ui/components/primitives';
import { Markdown } from '@/ui/components/Markdown';
import { stripLeadingHeading } from '@/lib/markdown';
import { getRule } from '@/features/rules/queries';
import { findTerm } from '@/lib/glossary';

export default async function RulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rule = getRule(slug);
  if (!rule) notFound();

  // Il nome italiano accanto a quello inglese: i dati SRD sono in inglese ma
  // l'interfaccia è italiana, e una condizione va riconosciuta a colpo d'occhio (AC15).
  const italian = findTerm(rule.name);

  return (
    <div className="max-w-3xl">
      <Panel className={`border-l-4 p-6 ${rule.kind === 'condizione' ? 'border-l-wax' : 'border-l-gold'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className={`text-3xl leading-tight ${rule.kind === 'condizione' ? 'text-wax' : 'text-gold'}`}>
              {rule.name}
            </h2>
            {italian && <p className="text-ink-soft text-lg italic">{italian.it}</p>}
          </div>
          <Badge tone={rule.kind === 'condizione' ? 'wax' : 'neutral'}>{rule.kind}</Badge>
        </div>

        <hr className="rule-gold my-4" />

        <Markdown source={stripLeadingHeading(rule.description, rule.name)} />
      </Panel>
      <SrdAttribution className="mt-6" />
    </div>
  );
}

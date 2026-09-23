import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/ui/components/primitives';
import { getLicense } from '@/features/sources/queries';

/** Il testo integrale di una licenza, come richiesto dall'OGL 1.0a (ADR-0013). */
export default async function LicensePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const license = getLicense(key);
  if (!license) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title={license.name}
        subtitle={license.documents.length ? `Vale per: ${license.documents.join(', ')}.` : 'Nessun manuale scaricato la usa più.'}
      />
      <Panel className="p-6">
        <p lang="en" className="text-ink text-base leading-relaxed whitespace-pre-wrap">
          {license.text}
        </p>
      </Panel>
      <Link href="/fonti" className="text-gold mt-6 inline-block text-base underline">
        ← Fonti aperte
      </Link>
    </div>
  );
}

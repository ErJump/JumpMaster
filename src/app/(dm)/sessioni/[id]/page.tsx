import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/ui/components/primitives';
import { Button, ButtonLink } from '@/ui/components/Button';
import { Markdown } from '@/ui/components/Markdown';
import { getSession } from '@/features/sessions/queries';
import { readPrep } from '@/features/sessions/schema';
import { deleteSession, toggleSecret } from '@/features/sessions/actions';
import { SecretToggle } from '@/features/sessions/components/SecretToggle';
import { PREP_STEPS, secretsProgress, type PrepItem } from '@/core/sessions';
import { linkTargets, resolveLinkIn } from '@/db/queries/links';

/**
 * Vista «al tavolo»: la preparazione da leggere mentre si gioca, coi collegamenti cliccabili e i
 * segreti da spuntare man mano che i giocatori li scoprono.
 */
export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(Number(id));
  if (!session) notFound();

  const prep = readPrep(session.prep);
  const targets = linkTargets(session.campaignId);
  const resolve = (target: string) => resolveLinkIn(targets, target);
  const { revealed, total } = secretsProgress(prep);
  const filled = (items: PrepItem[]) => items.filter((i) => i.text.trim() !== '');

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={`Sessione ${session.number}${session.title ? ` — ${session.title}` : ''}`}
        subtitle="Al tavolo: la preparazione da consultare mentre giochi. Spunta i segreti man mano che vengono scoperti."
        actions={
          <div className="flex gap-2">
            <ButtonLink href={`/sessioni/${session.id}/prepara`} variant="ghost">Prepara</ButtonLink>
            <ButtonLink href={`/sessioni/${session.id}/diario`} variant="ghost">Diario</ButtonLink>
          </div>
        }
      />

      <div className="space-y-4">
        {PREP_STEPS.map((step) => {
          const value = prep[step.key];
          const empty = typeof value === 'string' ? value.trim() === '' : filled(value as PrepItem[]).length === 0;
          if (empty) return null;

          return (
            <Panel key={step.key} className="p-5">
              <h2 className="text-gold mb-2 flex items-baseline gap-3 text-xl">
                <span className="text-gold-soft font-mono text-lg">{step.number}</span>
                {step.title}
                {step.kind === 'secrets' && (
                  <span className="text-ink-faint ml-auto font-mono text-base">
                    {revealed}/{total} rivelati
                  </span>
                )}
              </h2>

              {typeof value === 'string' ? (
                <Markdown source={value} resolveLink={resolve} />
              ) : step.kind === 'secrets' ? (
                <div className="space-y-0.5">
                  {prep.secrets.filter((s) => s.text.trim()).map((secret) => (
                    <SecretToggle
                      key={secret.id}
                      revealed={secret.revealed}
                      onToggle={toggleSecret.bind(null, session.id, secret.id)}
                    >
                      <Markdown source={secret.text} resolveLink={resolve} compact />
                    </SecretToggle>
                  ))}
                </div>
              ) : (
                <ul className="marker:text-gold-soft list-disc space-y-1 pl-6">
                  {filled(value as PrepItem[]).map((item) => (
                    <li key={item.id} className="text-ink">
                      <Markdown source={item.text} resolveLink={resolve} compact />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}

        {PREP_STEPS.every((step) => {
          const value = prep[step.key];
          return typeof value === 'string' ? !value.trim() : filled(value as PrepItem[]).length === 0;
        }) && (
          <Panel className="p-8 text-center">
            <p className="text-ink-soft text-lg">La preparazione è ancora vuota.</p>
            <div className="mt-4">
              <ButtonLink href={`/sessioni/${session.id}/prepara`}>Prepara in otto passi</ButtonLink>
            </div>
          </Panel>
        )}

        {session.journal.trim() && (
          <Panel className="border-l-gold border-l-4 p-5">
            <h2 className="text-gold mb-2 text-xl">Diario</h2>
            <Markdown source={session.journal} resolveLink={resolve} />
          </Panel>
        )}
      </div>

      <form action={deleteSession.bind(null, session.id)} className="mt-10">
        <Button type="submit" variant="danger">Elimina la sessione</Button>
      </form>
    </div>
  );
}

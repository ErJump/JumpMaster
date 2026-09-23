import Link from 'next/link';
import { PageHeader, Badge, EmptyState } from '@/ui/components/primitives';
import { Button } from '@/ui/components/Button';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { listSessions } from '@/features/sessions/queries';
import { createSession } from '@/features/sessions/actions';
import { readPrep } from '@/features/sessions/schema';
import { secretsProgress } from '@/core/sessions';

export default function SessionsPage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="La cronologia delle sessioni" />;

  const sessions = listSessions(campaign.id);
  const newSession = (
    <form action={createSession.bind(null, campaign.id)}>
      <Button type="submit">Prepara la {sessions.length > 0 ? `sessione ${sessions.length + 1}` : 'prima sessione'}</Button>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Sessioni"
        count={sessions.length || undefined}
        subtitle={`${campaign.name} — la cronologia della campagna. Prima si prepara, poi si gioca, poi si scrive il diario.`}
        actions={newSession}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon="🗓"
          title="Nessuna sessione, per ora"
          description="Prepara la prima in otto passi brevi, col metodo del Lazy DM: solo ciò che serve davvero al tavolo, e spazio per improvvisare."
          action={newSession}
        />
      ) : (
        <ol className="border-l-gold-soft/50 relative ml-3 space-y-4 border-l-2 pl-6">
          {sessions.map((session) => {
            const { revealed, total } = secretsProgress(readPrep(session.prep));
            return (
              <li key={session.id} className="relative">
                <span aria-hidden className="bg-gold absolute top-5 -left-[33px] h-3 w-3 rounded-full" />
                <Link href={`/sessioni/${session.id}`} className="panel hover:border-gold-soft block p-4 transition-colors">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-gold block text-xl font-semibold">
                        Sessione {session.number}
                        {session.title && <span className="text-ink"> — {session.title}</span>}
                      </span>
                      <span className="text-ink-faint block text-base">
                        {session.playedOn ? new Date(`${session.playedOn}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : 'da giocare'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {total > 0 && <Badge tone={revealed === total ? 'bottle' : 'gold'}>segreti {revealed}/{total}</Badge>}
                      {session.journal.trim() && <Badge>diario</Badge>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

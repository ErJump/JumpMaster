import Link from 'next/link';
import { PageHeader, Badge, EmptyState } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';
import { CampaignRequired } from '@/ui/components/CampaignRequired';
import { getActiveCampaign } from '@/features/campaigns/queries';
import { listCharacters } from '@/features/characters/queries';
import { deriveCharacter } from '@/features/characters/derive';
import { DISPOSITION_LABELS } from '@/features/characters/schema';
import type { BadgeTone } from '@/ui/components/primitives';

const DISPOSITION_TONE: Record<string, BadgeTone> = {
  friendly: 'bottle',
  neutral: 'neutral',
  hostile: 'wax',
  unknown: 'neutral',
};

export default function CharactersPage() {
  const campaign = getActiveCampaign();
  if (!campaign) return <CampaignRequired what="Il registro dei personaggi" />;

  const pcs = listCharacters(campaign.id, 'pc');
  const npcs = listCharacters(campaign.id, 'npc');

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Personaggi"
        count={pcs.length + npcs.length || undefined}
        subtitle={`${campaign.name} — le schede dei giocatori e chi hanno incontrato.`}
        actions={
          <div className="flex gap-2">
            <ButtonLink href="/personaggi/nuovo?tipo=pc">Nuovo PG</ButtonLink>
            <ButtonLink href="/personaggi/nuovo?tipo=npc" variant="ghost">
              Nuovo PNG
            </ButtonLink>
          </div>
        }
      />

      {pcs.length === 0 && npcs.length === 0 ? (
        <EmptyState
          icon="🧙"
          title="Nessun personaggio"
          description="Comincia dalle schede dei tuoi giocatori: le trascrivi una volta e non dovrai più chiedere «qual è la tua CA?»."
          action={<ButtonLink href="/personaggi/nuovo?tipo=pc">Aggiungi un PG</ButtonLink>}
        />
      ) : (
        <div className="space-y-8">
          {pcs.length > 0 && (
            <section>
              <h2 className="small-caps text-gold mb-3 text-xl">Personaggi giocanti</h2>
              <ul className="space-y-3">
                {pcs.map((row) => {
                  const derived = deriveCharacter(row);
                  return (
                    <li key={row.id}>
                      <Link href={`/personaggi/${row.id}`} className="panel hover:border-gold-soft block p-4 transition-colors">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-gold block text-xl font-semibold">{row.name}</span>
                            <span className="text-ink-faint block text-base">
                              {[row.race, row.className, row.subclass, `liv. ${row.level}`].filter(Boolean).join(' · ')}
                              {row.playerName && ` — ${row.playerName}`}
                            </span>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Badge tone="gold">CA {row.ac}</Badge>
                            <Badge>{row.maxHp} PF</Badge>
                            <Badge tone="bottle">Perc. {derived.passives.perception}</Badge>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {npcs.length > 0 && (
            <section>
              <h2 className="small-caps text-gold mb-3 text-xl">Personaggi non giocanti</h2>
              <ul className="space-y-3">
                {npcs.map((row) => (
                  <li key={row.id}>
                    <Link href={`/personaggi/${row.id}`} className="panel hover:border-gold-soft block p-4 transition-colors">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-ink block text-xl font-semibold">{row.name}</span>
                          <span className="text-ink-faint block text-base">
                            {[row.role, row.location].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {row.secret && <Badge tone="wax" title="Ha un segreto">⚠️ segreto</Badge>}
                          <Badge tone={DISPOSITION_TONE[row.disposition] ?? 'neutral'}>
                            {DISPOSITION_LABELS[row.disposition]}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

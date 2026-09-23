'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Badge, Panel } from '@/ui/components/primitives';
import { Button } from '@/ui/components/Button';

export interface InstalledView {
  key: string;
  name: string;
  publisher: string;
  permalink: string | null;
  monsterCount: number;
  importedOn: string;
  licenses: Array<{ key: string; name: string }>;
  usage: { encounters: number; characters: number };
}

interface CatalogView {
  document: { key: string; name: string; display_name?: string; publisher: { name: string }; licenses: Array<{ key: string; name: string }>; permalink?: string | null };
  monsterCount: number;
}

type Catalog = { state: 'loading' } | { state: 'ready'; entries: CatalogView[] } | { state: 'offline'; error: string };
type Download = { state: 'running'; received: number; total: number } | { state: 'error'; message: string } | { state: 'done'; count: number };

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('it-IT')} ${n === 1 ? one : many}`;

export function SourcesManager({ installed, remove }: { installed: InstalledView[]; remove: (key: string) => Promise<void> }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog>({ state: 'loading' });
  const [downloads, setDownloads] = useState<Record<string, Download>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removing, startRemoving] = useTransition();

  useEffect(() => {
    let alive = true;
    fetch('/api/fonti')
      .then((response) => response.json() as Promise<{ ok: true; entries: CatalogView[] } | { ok: false; error: string }>)
      .then((result) => {
        if (alive) setCatalog(result.ok ? { state: 'ready', entries: result.entries } : { state: 'offline', error: result.error });
      })
      .catch(() => {
        if (alive) setCatalog({ state: 'offline', error: 'Il server dell’app non risponde.' });
      });
    return () => {
      alive = false;
    };
  }, []);

  async function download(key: string) {
    const set = (value: Download) => setDownloads((all) => ({ ...all, [key]: value }));
    set({ state: 'running', received: 0, total: 0 });
    try {
      const response = await fetch(`/api/fonti/${key}`, { method: 'POST' });
      if (!response.body) throw new Error('nessuna risposta');
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line) as { type: 'progress'; received: number; total: number } | { type: 'done'; count: number } | { type: 'error'; message: string };
          if (event.type === 'progress') set({ state: 'running', received: event.received, total: event.total });
          else if (event.type === 'done') {
            set({ state: 'done', count: event.count });
            router.refresh();
          } else set({ state: 'error', message: event.message });
        }
      }
    } catch {
      set({ state: 'error', message: 'Download interrotto: controlla la connessione e riprova. Nulla è stato scritto.' });
    }
  }

  const installedKeys = new Set(installed.map((s) => s.key));
  const available = catalog.state === 'ready' ? catalog.entries.filter((e) => !installedKeys.has(e.document.key)) : [];
  const busy = Object.values(downloads).some((d) => d.state === 'running');

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="small-caps text-gold text-lg">Scaricati</h2>
        {installed.length === 0 ? (
          <p className="text-ink-soft text-base">Nessuno, per ora: nel bestiario ci sono i 334 mostri dell’SRD.</p>
        ) : (
          <ul className="space-y-3">
            {installed.map((source) => {
              const used = source.usage.encounters + source.usage.characters > 0;
              const job = downloads[source.key];
              return (
                <li key={source.key}>
                  <Panel className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-ink text-xl font-semibold">{source.name}</p>
                        <p className="text-ink-soft text-base">
                          {source.publisher} · {plural(source.monsterCount, 'mostro', 'mostri')} · scaricato il {source.importedOn}
                        </p>
                        <p className="text-ink-soft text-base">
                          Licenza:{' '}
                          {source.licenses.map((license, i) => (
                            <span key={license.key}>
                              {i > 0 && ', '}
                              <Link href={`/fonti/licenze/${license.key}`} className="text-gold underline">
                                {license.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/bestiario?source=${source.key}`} className="text-gold self-center text-base underline">
                          Nel bestiario
                        </Link>
                        <Button variant="ghost" disabled={busy || catalog.state !== 'ready'} onClick={() => void download(source.key)}>
                          Riscarica
                        </Button>
                        <Button variant="danger" disabled={busy || removing} onClick={() => setConfirming(source.key)}>
                          Rimuovi
                        </Button>
                      </div>
                    </div>
                    {job && <DownloadStatus job={job} />}
                    {confirming === source.key && (
                      <div role="alertdialog" aria-label={`Rimuovere ${source.name}?`} className="border-wax/50 space-y-2 rounded-xs border p-3">
                        <p className="text-ink text-base">
                          {used
                            ? `I suoi mostri sono in ${plural(source.usage.encounters, 'scontro', 'scontri')} e ${plural(source.usage.characters, 'PNG', 'PNG')}. Gli scontri restano giocabili con PF, CA e PE che hanno già; si perde lo stat block completo.`
                            : 'Nessuno scontro e nessun PNG usa i suoi mostri.'}{' '}
                          Potrai sempre riscaricarlo.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            disabled={removing}
                            onClick={() =>
                              startRemoving(async () => {
                                await remove(source.key);
                                setConfirming(null);
                              })
                            }
                          >
                            Sì, rimuovi
                          </Button>
                          <Button variant="ghost" onClick={() => setConfirming(null)}>
                            Annulla
                          </Button>
                        </div>
                      </div>
                    )}
                  </Panel>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="small-caps text-gold text-lg">Disponibili su Open5e</h2>
        {catalog.state === 'loading' && <p className="text-ink-soft text-base">Chiedo a Open5e quali manuali ci sono…</p>}
        {catalog.state === 'offline' && (
          <p role="status" className="text-ink-soft text-base">
            {catalog.error} Senza rete non vedo il catalogo; i manuali già scaricati funzionano lo stesso.
          </p>
        )}
        {catalog.state === 'ready' && available.length === 0 && <p className="text-ink-soft text-base">Hai già scaricato tutto quello che c’è.</p>}
        <ul className="space-y-3">
          {available.map(({ document, monsterCount }) => {
            const job = downloads[document.key];
            return (
              <li key={document.key}>
                <Panel className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-ink text-xl font-semibold">{document.display_name || document.name}</p>
                      <p className="text-ink-soft text-base">
                        {document.publisher.name} · {plural(monsterCount, 'mostro', 'mostri')}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {document.licenses.map((license) => (
                          <Badge key={license.key}>{license.name}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button disabled={busy} onClick={() => void download(document.key)}>
                      Scarica
                    </Button>
                  </div>
                  {job && <DownloadStatus job={job} />}
                </Panel>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function DownloadStatus({ job }: { job: Download }) {
  if (job.state === 'error') {
    return (
      <p role="alert" className="text-wax text-base">
        {job.message}
      </p>
    );
  }
  if (job.state === 'done') return <p className="text-bottle text-base">✓ {plural(job.count, 'mostro', 'mostri')} nel bestiario.</p>;
  const percent = job.total > 0 ? Math.round((job.received / job.total) * 100) : 0;
  return (
    <div aria-live="polite" className="space-y-1">
      <div className="bg-surface-raised h-2 overflow-hidden rounded-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="bg-gold h-full transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-ink-soft text-base">{job.total > 0 ? `${job.received} / ${job.total} mostri…` : 'Mi collego a Open5e…'}</p>
    </div>
  );
}

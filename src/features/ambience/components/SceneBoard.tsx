'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SYNTH_LABELS, SYNTH_SOUNDS, type Layer, type SynthSound } from '@/core/ambience';
import { Panel } from '@/ui/components/primitives';
import { Button } from '@/ui/components/Button';
import { AUTOSAVE_LABEL, useAutosave } from '@/ui/hooks/useAutosave';
import { useAmbience, type PlayableScene } from './AmbienceProvider';

export interface TrackItem {
  id: number;
  name: string;
  url: string;
  sizeBytes: number;
}

interface Actions {
  createBaseScenes: () => Promise<void>;
  createScene: (raw: unknown) => Promise<{ id?: number; error?: string }>;
  renameScene: (id: number, raw: unknown) => Promise<{ error?: string }>;
  saveSceneLayers: (id: number, raw: unknown) => Promise<{ error?: string }>;
  deleteScene: (id: number) => Promise<void>;
  deleteTrack: (id: number) => Promise<void>;
}

export function SceneBoard({ scenes: initial, tracks, actions }: { scenes: PlayableScene[]; tracks: TrackItem[]; actions: Actions }) {
  const router = useRouter();
  const ambience = useAmbience();
  const [scenes, setScenes] = useState(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [seen, setSeen] = useState(initial);

  // Dopo un `router.refresh()` arrivano scene nuove dal server: si adottano (qui, non in un effetto).
  if (initial !== seen) {
    setSeen(initial);
    setScenes(initial);
  }

  const toggle = (scene: PlayableScene) => {
    if (ambience.playing?.id === scene.id) ambience.stop();
    else void ambience.play(scene, tracks);
  };

  const changeLayers = (id: number, layers: Layer[]) => {
    setScenes((all) => all.map((scene) => (scene.id === id ? { ...scene, layers } : scene)));
    const scene = scenes.find((s) => s.id === id);
    if (scene) ambience.update({ ...scene, layers }, tracks);
  };

  const editingScene = scenes.find((scene) => scene.id === editing);

  return (
    <div className="space-y-8">
      {scenes.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-8 py-12 text-center">
          <span aria-hidden className="text-5xl">🎵</span>
          <h2 className="text-ink text-2xl">Nessuna scena, per ora</h2>
          <p className="text-ink-soft max-w-prose text-lg">
            Sette scene pronte — tempesta, taverna, camino, grotta, bosco di notte, mare, montagna — da usare subito e
            cambiare come vuoi.
          </p>
          <Button disabled={pending} onClick={() => startTransition(async () => (await actions.createBaseScenes(), router.refresh()))}>
            Crea le scene di base
          </Button>
        </Panel>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {scenes.map((scene) => {
            const on = ambience.playing?.id === scene.id;
            return (
              <li key={scene.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(scene)}
                  aria-pressed={on}
                  className={`panel flex w-full flex-col items-center gap-2 px-3 py-5 text-center transition-colors ${on ? 'border-gold bg-gold/10' : 'hover:border-gold-soft'}`}
                >
                  <span aria-hidden className="text-4xl">
                    {scene.icon}
                  </span>
                  <span className={`text-lg font-semibold ${on ? 'text-gold' : 'text-ink'}`}>{scene.name}</span>
                  <span className="text-ink-soft text-sm">{on ? '■ in corso — clic per fermare' : `${scene.layers.length} strati`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(editing === scene.id ? null : scene.id)}
                  className="text-ink-faint hover:text-gold absolute top-1 right-2 text-base"
                  aria-label={`Modifica ${scene.name}`}
                  title="Modifica"
                >
                  ✎
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editingScene && (
        <SceneEditor
          key={editingScene.id}
          scene={editingScene}
          tracks={tracks}
          onLayers={(layers) => changeLayers(editingScene.id, layers)}
          save={(layers) => actions.saveSceneLayers(editingScene.id, layers)}
          rename={(meta) => actions.renameScene(editingScene.id, meta)}
          remove={() =>
            startTransition(async () => {
              if (ambience.playing?.id === editingScene.id) ambience.stop();
              await actions.deleteScene(editingScene.id);
              setEditing(null);
              router.refresh();
            })
          }
          close={() => setEditing(null)}
        />
      )}

      {scenes.length > 0 && <NewScene create={actions.createScene} onCreated={(id) => (router.refresh(), setEditing(id))} />}

      <TracksPanel tracks={tracks} remove={actions.deleteTrack} />

      <Panel className="space-y-2 p-5">
        <h2 className="small-caps text-gold text-lg">Su Discord</h2>
        <p className="text-ink-soft text-base leading-relaxed">
          L’atmosfera suona da questa finestra del browser. Perché la sentano anche i giocatori, quando condividi lo schermo
          su Discord attiva l’<strong className="text-ink">audio della condivisione</strong>: se condividi una finestra
          del browser (anche la Vista Giocatori), Discord trasmette l’audio del browser.
        </p>
        <p className="text-ink-soft text-base leading-relaxed">
          Tieni il volume basso: è un sottofondo, le voci dei giocatori devono restare sopra.
        </p>
      </Panel>
    </div>
  );
}

function SceneEditor({
  scene,
  tracks,
  onLayers,
  save,
  rename,
  remove,
  close,
}: {
  scene: PlayableScene;
  tracks: TrackItem[];
  onLayers: (layers: Layer[]) => void;
  save: (layers: Layer[]) => Promise<{ error?: string }>;
  rename: (meta: { name: string; icon: string }) => Promise<{ error?: string }>;
  remove: () => void;
  close: () => void;
}) {
  const { status, error, schedule } = useAutosave(save, 400);
  const [name, setName] = useState(scene.name);
  const [icon, setIcon] = useState(scene.icon);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setLayers = (layers: Layer[]) => {
    onLayers(layers);
    schedule(layers);
  };
  const usedSounds = new Set(scene.layers.flatMap((l) => (l.kind === 'synth' ? [l.sound] : [])));
  const usedTracks = new Set(scene.layers.flatMap((l) => (l.kind === 'track' ? [l.trackId] : [])));
  const trackName = new Map(tracks.map((t) => [t.id, t.name]));

  const addLayer = (value: string) => {
    if (!value) return;
    const [kind, key] = value.split(':') as ['synth' | 'track', string];
    const layer: Layer =
      kind === 'synth'
        ? { id: key, kind: 'synth', sound: key as SynthSound, volume: 0.6 }
        : { id: `track-${key}`, kind: 'track', trackId: Number(key), volume: 0.6 };
    setLayers([...scene.layers, layer]);
  };

  const commitName = async () => {
    if (name.trim() === scene.name && icon.trim() === scene.icon) return;
    const result = await rename({ name, icon });
    setRenameError(result.error ?? null);
  };

  return (
    <Panel as="section" className="space-y-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="small-caps text-gold text-sm">Icona</span>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} onBlur={commitName} className="panel text-ink w-16 px-2 py-1.5 text-center text-xl outline-none" />
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="small-caps text-gold text-sm">Nome della scena</span>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={commitName} className="panel text-ink px-3 py-1.5 text-lg outline-none" />
        </label>
        <span aria-live="polite" className={`text-base ${error || renameError ? 'text-wax' : 'text-ink-faint'}`}>
          {renameError ?? error ?? AUTOSAVE_LABEL[status]}
        </span>
        <Button variant="ghost" onClick={close}>
          Chiudi
        </Button>
      </div>

      <ul className="space-y-2">
        {scene.layers.length === 0 && <li className="text-ink-soft text-base">Nessuno strato: aggiungine uno qui sotto.</li>}
        {scene.layers.map((layer) => {
          const label =
            layer.kind === 'synth'
              ? `${SYNTH_LABELS[layer.sound].icon} ${SYNTH_LABELS[layer.sound].label}`
              : `🎼 ${trackName.get(layer.trackId) ?? 'Traccia'}`;
          return (
            <li key={layer.id} className="flex items-center gap-3">
              <span className="text-ink w-48 truncate text-base">{label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={layer.volume}
                onChange={(e) => setLayers(scene.layers.map((l) => (l.id === layer.id ? { ...l, volume: Number(e.target.value) } : l)))}
                aria-label={`Volume di ${label}`}
                className="flex-1 accent-[var(--jm-gold)]"
              />
              <span className="text-ink-soft w-10 text-right font-mono text-sm tabular-nums">{Math.round(layer.volume * 100)}</span>
              <button
                type="button"
                onClick={() => setLayers(scene.layers.filter((l) => l.id !== layer.id))}
                className="text-ink-faint hover:text-wax px-1 text-lg"
                aria-label={`Togli ${label}`}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <select value="" onChange={(e) => addLayer(e.target.value)} aria-label="Aggiungi uno strato" className="panel text-ink px-3 py-1.5 text-base outline-none">
          <option value="">＋ Aggiungi uno strato…</option>
          <optgroup label="Suoni generati">
            {SYNTH_SOUNDS.filter((sound) => !usedSounds.has(sound)).map((sound) => (
              <option key={sound} value={`synth:${sound}`}>
                {SYNTH_LABELS[sound].icon} {SYNTH_LABELS[sound].label}
              </option>
            ))}
          </optgroup>
          {tracks.length > 0 && (
            <optgroup label="Le tue tracce">
              {tracks
                .filter((track) => !usedTracks.has(track.id))
                .map((track) => (
                  <option key={track.id} value={`track:${track.id}`}>
                    🎼 {track.name}
                  </option>
                ))}
            </optgroup>
          )}
        </select>
        <span className="flex-1" />
        {confirmDelete ? (
          <span className="flex items-center gap-2">
            <span className="text-ink text-base">Eliminare «{scene.name}»?</span>
            <Button variant="danger" onClick={remove}>
              Sì, elimina
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Annulla
            </Button>
          </span>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            Elimina la scena
          </Button>
        )}
      </div>
    </Panel>
  );
}

function NewScene({ create, onCreated }: { create: Actions['createScene']; onCreated: (id: number) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    const result = await create({ name, icon: '🎵' });
    if (result.error) return setError(result.error);
    setName('');
    setError(null);
    if (result.id) onCreated(result.id);
  };
  return (
    <form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nuova scena — «La cripta di Strahd»"
        aria-label="Nome della nuova scena"
        className="panel text-ink placeholder:text-ink-faint min-w-64 flex-1 px-3 py-2 text-base outline-none"
      />
      <Button type="submit" variant="ghost" disabled={!name.trim()}>
        Crea
      </Button>
      {error && (
        <span role="alert" className="text-wax text-base">
          {error}
        </span>
      )}
    </form>
  );
}

function TracksPanel({ tracks, remove }: { tracks: TrackItem[]; remove: (id: number) => Promise<void> }) {
  const router = useRouter();
  const [status, setStatus] = useState<{ kind: 'idle' } | { kind: 'uploading'; name: string } | { kind: 'error'; message: string }>({ kind: 'idle' });
  const [confirming, setConfirming] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const upload = async (file: File) => {
    setStatus({ kind: 'uploading', name: file.name });
    const body = new FormData();
    body.set('file', file);
    try {
      const response = await fetch('/api/atmosfera/tracce', { method: 'POST', body });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!result.ok) return setStatus({ kind: 'error', message: result.error ?? 'Caricamento non riuscito.' });
      setStatus({ kind: 'idle' });
      router.refresh();
    } catch {
      setStatus({ kind: 'error', message: 'Caricamento non riuscito: il server non ha risposto.' });
    }
  };

  return (
    <Panel as="section" className="space-y-3 p-5">
      <h2 className="small-caps text-gold text-lg">Le tue tracce</h2>
      <p className="text-ink-soft text-base">
        Musica o suoni tuoi, da aggiungere come strato a una scena. MP3, OGG, WAV, M4A o FLAC, fino a 40 MB. Restano su
        questo PC.
      </p>
      <input
        type="file"
        accept="audio/*,.mp3,.ogg,.wav,.m4a,.flac"
        aria-label="Carica una traccia"
        disabled={status.kind === 'uploading'}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void upload(file);
        }}
        className="text-ink-soft file:border-border-strong file:text-ink file:bg-surface-raised block w-full text-base file:mr-3 file:rounded-xs file:border file:px-3 file:py-1.5"
      />
      <div aria-live="polite" className="text-base">
        {status.kind === 'uploading' && <p className="text-ink-soft">Carico «{status.name}»…</p>}
        {status.kind === 'error' && (
          <p role="alert" className="text-wax">
            {status.message}
          </p>
        )}
      </div>
      {tracks.length > 0 && (
        <ul className="space-y-2">
          {tracks.map((track) => (
            <li key={track.id} className="flex flex-wrap items-center gap-3">
              <span className="text-ink min-w-0 flex-1 truncate text-base">🎼 {track.name}</span>
              <span className="text-ink-faint text-sm">{(track.sizeBytes / 1024 / 1024).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB</span>
              {confirming === track.id ? (
                <>
                  <span className="text-ink text-base">Eliminarla? Sparisce anche dalle scene.</span>
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() => startTransition(async () => (await remove(track.id), setConfirming(null), router.refresh()))}
                  >
                    Sì, elimina
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirming(null)}>
                    Annulla
                  </Button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirming(track.id)} className="text-ink-faint hover:text-wax px-1 text-lg" aria-label={`Elimina ${track.name}`}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

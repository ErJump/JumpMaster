'use client';

import { useEffect, useState } from 'react';
import { HP_BAND_LABELS, type HpBand, type PublicCombat, type PublicCombatant } from '@/core/events';
import type { PublicMap } from '@/core/maps';
import { FogLayer, GridLayer, PinGlyph, TokenGlyph } from '@/ui/components/MapLayers';
import type { PlayerView, PublicRoll } from '../types';

const ROLL_VISIBLE_MS = 8000;

const BAND_TONE: Record<HpBand, string> = {
  illeso: 'text-bottle border-bottle/60',
  ferito: 'text-gold border-gold/60',
  malconcio: 'text-arcane border-arcane/60',
  'in-fin-di-vita': 'text-wax border-wax/60',
  morto: 'text-ink-faint border-border-strong',
};

/**
 * La finestra dei giocatori. Si aggiorna da sola tramite SSE (ADR-0009) e mostra soltanto ciò
 * che `buildPlayerView` ha già deciso essere pubblico.
 *
 * Tipografia **maggiorata** di proposito: questa finestra si guarda da lontano o attraverso la
 * compressione video di Discord (SPEC-0008 AC4).
 */
export function PlayerScreen({ initial }: { initial: PlayerView }) {
  const [view, setView] = useState<PlayerView>(initial);
  const [connected, setConnected] = useState(true);
  const [toast, setToast] = useState<PublicRoll | null>(null);

  useEffect(() => {
    const source = new EventSource('/api/live');
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let lastRollAt = initial.roll?.at ?? 0;

    source.onopen = () => setConnected(true);
    // EventSource si riconnette da solo: qui ci limitiamo a dirlo (AC3).
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      const next = JSON.parse(message.data as string) as PlayerView;
      setView(next);
      setConnected(true);

      // Un tiro pubblico nuovo compare per qualche secondo; uno vecchio no.
      if (next.roll && next.roll.at !== lastRollAt && Date.now() - next.roll.at < ROLL_VISIBLE_MS) {
        lastRollAt = next.roll.at;
        setToast(next.roll);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setToast(null), ROLL_VISIBLE_MS);
      }
    };

    return () => {
      source.close();
      clearTimeout(hideTimer);
    };
  }, [initial.roll?.at]);

  return (
    <main className="relative flex min-h-screen flex-col px-10 py-8">
      {view.kind === 'combat' && <CombatView combat={view.combat} />}
      {view.kind === 'handout' && <HandoutView handout={view.handout} />}
      {view.kind === 'idle' && <IdleView campaign={view.campaign} />}
      {view.kind === 'map' && <MapView map={view.map} />}

      {toast && (
        <div className="panel border-gold fixed bottom-10 left-1/2 max-w-[80vw] -translate-x-1/2 border-2 px-8 py-5 text-center shadow-2xl">
          <p className="text-gold font-mono text-3xl">{toast.text}</p>
        </div>
      )}

      {!connected && (
        <p className="text-ink-faint fixed top-3 right-4 text-sm" aria-live="polite">
          riconnessione…
        </p>
      )}
    </main>
  );
}

function IdleView({ campaign }: { campaign: string | null }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span aria-hidden className="text-gold-soft text-8xl">
        ⚔
      </span>
      <h1 className="text-gold mt-6 text-6xl leading-tight">{campaign ?? 'JumpMaster'}</h1>
      <hr className="rule-gold mx-auto my-8 w-80" />
      <p className="text-ink-soft text-3xl italic">La storia sta per continuare…</p>
    </div>
  );
}

function HandoutView({ handout }: { handout: { title: string; body: string; imageUrl: string | null } }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8">
      <h1 className="text-gold text-center text-6xl leading-tight">{handout.title}</h1>
      {handout.imageUrl && (
        // Le immagini sono locali e generate dall'app: `next/image` non servirebbe e
        // richiederebbe di configurare ogni sorgente.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={handout.imageUrl}
          alt={handout.title}
          className="panel max-h-[62vh] max-w-full object-contain p-2"
        />
      )}
      {handout.body && (
        <div className="panel drop-cap text-ink max-w-4xl px-10 py-8 text-3xl leading-relaxed whitespace-pre-line">
          {handout.body}
        </div>
      )}
    </div>
  );
}

function CombatView({ combat }: { combat: PublicCombat }) {
  const current = combat.combatants.find((c) => c.id === combat.currentId);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-6 flex items-baseline justify-between gap-6">
        <p className="text-ink-soft small-caps text-3xl">
          Round <span className="text-gold font-mono text-5xl">{combat.round}</span>
        </p>
        {current && (
          <p className="text-ink text-3xl">
            Tocca a <strong className="text-gold">{current.name}</strong>
          </p>
        )}
      </header>

      <ol className="space-y-3">
        {combat.combatants.map((combatant) => (
          <PublicRow key={combatant.id} combatant={combatant} isTurn={combatant.id === combat.currentId} />
        ))}
      </ol>
    </div>
  );
}

function PublicRow({ combatant, isTurn }: { combatant: PublicCombatant; isTurn: boolean }) {
  const dead = combatant.status === 'dead';

  return (
    <li
      className={`panel flex items-center gap-6 px-6 py-4 ${
        isTurn ? 'border-l-gold bg-gold/15 border-l-8' : 'border-l-8 border-l-transparent'
      } ${dead ? 'opacity-40' : ''}`}
    >
      <span className="text-ink-faint w-14 shrink-0 text-center font-mono text-3xl tabular-nums">
        {combatant.initiative ?? '—'}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${isTurn ? 'text-gold text-4xl' : 'text-ink text-3xl'} ${dead ? 'line-through' : ''}`}>
          {isTurn && '▶ '}
          {combatant.name}
        </p>
        {(combatant.conditions.length > 0 || combatant.concentration) && (
          <p className="text-ink-soft mt-1 text-xl">
            {[...combatant.conditions.map((c) => c.charAt(0).toUpperCase() + c.slice(1)), combatant.concentration && `✦ ${combatant.concentration}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>

      {combatant.kind === 'pc' ? <PcHealth combatant={combatant} /> : (
        <span className={`small-caps shrink-0 rounded-xs border-2 px-4 py-1 text-2xl ${BAND_TONE[combatant.band]}`}>
          {HP_BAND_LABELS[combatant.band]}
        </span>
      )}
    </li>
  );
}

function PcHealth({ combatant }: { combatant: Extract<PublicCombatant, { kind: 'pc' }> }) {
  if (combatant.status === 'unconscious') {
    return (
      <div className="shrink-0 text-right">
        <p className="text-wax small-caps text-2xl">A terra</p>
        <p className="font-mono text-2xl">
          <span className="text-bottle">{[0, 1, 2].map((i) => (i < combatant.deathSaves.successes ? '●' : '○')).join(' ')}</span>
          {'  '}
          <span className="text-wax">{[0, 1, 2].map((i) => (i < combatant.deathSaves.failures ? '●' : '○')).join(' ')}</span>
        </p>
      </div>
    );
  }

  const ratio = combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 0;
  const color = ratio > 0.5 ? 'bg-bottle' : ratio > 0.25 ? 'bg-gold' : 'bg-wax';

  return (
    <div className="w-64 shrink-0">
      <p className="text-ink text-right font-mono text-3xl tabular-nums">
        {combatant.currentHp}
        <span className="text-ink-faint text-xl">/{combatant.maxHp}</span>
        {combatant.tempHp > 0 && <span className="text-arcane text-xl"> +{combatant.tempHp}</span>}
      </p>
      <div className="mt-1 h-3 overflow-hidden rounded-xs bg-[var(--jm-surface-raised)]">
        <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${Math.max(0, ratio) * 100}%` }} />
      </div>
    </div>
  );
}

/**
 * La mappa per i giocatori: nebbia **opaca**, e soltanto i segnalini che `toPublicMap` ha già
 * deciso essere visibili — quelli sotto la nebbia o nascosti qui non arrivano proprio (ADR-0012).
 */
function MapView({ map }: { map: PublicMap }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      {map.kind === 'battle' && map.turn && (
        <p className="text-ink text-3xl">
          Tocca a <strong className="text-gold">{map.turn}</strong>
        </p>
      )}
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        className="panel block max-h-[82vh] w-auto max-w-full"
        style={{ aspectRatio: `${map.width} / ${map.height}` }}
      >
        {map.imageUrl && <image href={map.imageUrl} width={map.width} height={map.height} />}
        {map.kind === 'battle' && (
          <>
            {map.showGrid && <GridLayer width={map.width} height={map.height} grid={map.grid} id="player-grid" />}
            <FogLayer cols={map.cols} rows={map.rows} grid={map.grid} revealed={new Set(map.revealed)} opacity={1} />
            {map.tokens.map((token) => (
              <TokenGlyph key={token.id} {...token} grid={map.grid} dead={token.dead} active={token.active} />
            ))}
          </>
        )}
        {map.kind === 'world' &&
          map.pins.map((pin) => (
            <PinGlyph key={pin.id} x={pin.x * map.width} y={pin.y * map.height} label={pin.label} width={map.width} />
          ))}
      </svg>
    </div>
  );
}

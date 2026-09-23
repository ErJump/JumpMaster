'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAmbience } from './AmbienceProvider';

/**
 * Nella barra in alto, su ogni pagina del DM: cosa suona, quanto forte, e lo stop (SPEC-0016 AC3).
 * Quando non suona nulla non occupa spazio.
 */
export function AmbienceBar() {
  const { playing, volume, setVolume, stop } = useAmbience();
  if (!playing) return null;

  return (
    <div className="border-border-strong flex items-center gap-3 rounded-xs border px-3 py-1.5" role="group" aria-label="Atmosfera in corso">
      <Link href="/atmosfera" className="text-ink hover:text-gold flex items-center gap-2 text-base" title="Apri l’atmosfera">
        <span aria-hidden>{playing.icon}</span>
        <span className="max-w-40 truncate">{playing.name}</span>
      </Link>
      <LevelMeter />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        aria-label="Volume dell’atmosfera"
        className="w-24 accent-[var(--jm-gold)]"
      />
      <button type="button" onClick={stop} className="text-ink-soft hover:text-wax text-lg" aria-label="Ferma l’atmosfera" title="Ferma">
        ■
      </button>
    </div>
  );
}

/** Cinque barrette che si muovono col suono: si vede che suona anche con le cuffie scollegate. */
function LevelMeter() {
  const { level } = useAmbience();
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let last = 0;
    const loop = (time: number) => {
      if (time - last > 90) {
        last = time;
        setValue(level());
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [level]);

  // Il livello RMS di un'atmosfera sta sotto 0,3: si scala perché le barrette si muovano davvero.
  const lit = Math.min(5, Math.round(value * 18));
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((bar) => (
        <span key={bar} className={`w-1 rounded-sm transition-all ${bar <= lit ? 'bg-gold' : 'bg-border-strong'}`} style={{ height: `${bar * 20}%` }} />
      ))}
    </span>
  );
}

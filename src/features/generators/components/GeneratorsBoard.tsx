'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ANCESTRIES,
  ANCESTRY_LABELS,
  generateEncounter,
  generateHook,
  generateNpc,
  generateRumor,
  generateShop,
  generateTavern,
  generateTreasure,
  type Ancestry,
  type EncounterCandidate,
  type GeneratedEncounter,
  type GeneratedHook,
  type GeneratedNpc,
  type GeneratedRumor,
  type GeneratedShop,
  type GeneratedTavern,
  type GeneratedTreasure,
  type ShopStock,
  type TreasureItem,
} from '@/core/generators';
import { DIFFICULTY_INFO, type Difficulty } from '@/core/rules';
import { DmOnly, Line, ResultActions, StartButton, price, type SaveResult } from './parts';

export interface Savers {
  saveNpc?: (npc: GeneratedNpc) => Promise<SaveResult>;
  saveNote?: (note: { title: string; kind: string; body: string }) => Promise<SaveResult>;
  saveEncounter?: (encounter: { name: string; entries: Array<{ slug: string; count: number }> }) => Promise<SaveResult>;
}

const TABS = [
  { id: 'npc', label: '🧙 PNG' },
  { id: 'tavern', label: '🍺 Taverna' },
  { id: 'shop', label: '⚖️ Bottega' },
  { id: 'rumor', label: '👂 Voce di paese' },
  { id: 'hook', label: '🧵 Spunto' },
  { id: 'encounter', label: '⚔️ Incontro' },
  { id: 'treasure', label: '💰 Tesoro' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const cardClass = 'panel p-6';

export function GeneratorsBoard({
  monsters,
  equipment,
  magicItems,
  party,
  savers,
}: {
  monsters: EncounterCandidate[];
  equipment: ShopStock[];
  magicItems: TreasureItem[];
  party: { level: number; size: number };
  savers: Savers;
}) {
  const [tab, setTab] = useState<TabId>('npc');

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-2" aria-label="Generatori">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`rounded-xs border px-4 py-2 text-base transition-colors ${
              tab === t.id ? 'border-gold bg-gold/15 text-gold' : 'border-border-strong text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Ogni scheda resta montata: cambiando scheda non si perde ciò che si è generato. */}
      <div hidden={tab !== 'npc'}><NpcCard save={savers.saveNpc} /></div>
      <div hidden={tab !== 'tavern'}><TavernCard save={savers.saveNote} /></div>
      <div hidden={tab !== 'shop'}><ShopCard equipment={equipment} save={savers.saveNote} /></div>
      <div hidden={tab !== 'rumor'}><RumorCard save={savers.saveNote} /></div>
      <div hidden={tab !== 'hook'}><HookCard save={savers.saveNote} /></div>
      <div hidden={tab !== 'encounter'}><EncounterCard monsters={monsters} party={party} save={savers.saveEncounter} /></div>
      <div hidden={tab !== 'treasure'}><TreasureCard magicItems={magicItems} defaultLevel={party.level} save={savers.saveNote} /></div>
    </div>
  );
}

/* ── PNG ──────────────────────────────────────────────────────────── */

function NpcCard({ save }: { save?: Savers['saveNpc'] }) {
  const [ancestry, setAncestry] = useState<Ancestry | ''>('');
  const [npc, setNpc] = useState<GeneratedNpc | null>(null);
  const generate = () => setNpc(generateNpc(Math.random, ancestry ? { ancestry } : {}));

  return (
    <section className={cardClass}>
      <label className="text-ink-soft mb-4 flex items-center gap-3 text-base">
        Ascendenza
        <select
          value={ancestry}
          onChange={(event) => setAncestry(event.target.value as Ancestry | '')}
          className="panel text-ink px-2 py-1.5 text-base outline-none"
        >
          <option value="">qualsiasi</option>
          {ANCESTRIES.map((a) => <option key={a} value={a}>{ANCESTRY_LABELS[a]}</option>)}
        </select>
      </label>

      {!npc ? (
        <StartButton onClick={generate} label="Genera un PNG" />
      ) : (
        <>
          <h2 className="text-gold text-3xl">{npc.name}</h2>
          <p className="text-ink-soft mb-3 text-lg italic">{ANCESTRY_LABELS[npc.ancestry]} · {npc.occupation}</p>
          <div className="space-y-1">
            <Line label="Aspetto">{npc.appearance}.</Line>
            <Line label="Modi">{npc.manner}.</Line>
            <Line label="Voce">{npc.voice}.</Line>
            <Line label="Cosa vuole">{npc.want}.</Line>
          </div>
          <DmOnly label="Segreto">{npc.secret}.</DmOnly>
          <ResultActions
            onRegenerate={generate}
            save={save ? () => save(npc) : undefined}
            saveLabel="Salva come PNG"
            openHref={(id) => `/personaggi/${id}`}
          />
        </>
      )}
    </section>
  );
}

/* ── Taverna ──────────────────────────────────────────────────────── */

function TavernCard({ save }: { save?: Savers['saveNote'] }) {
  const [tavern, setTavern] = useState<GeneratedTavern | null>(null);
  const generate = () => setTavern(generateTavern(Math.random));

  return (
    <section className={cardClass}>
      {!tavern ? (
        <StartButton onClick={generate} label="Genera una taverna" />
      ) : (
        <>
          <h2 className="text-gold text-3xl">{tavern.name}</h2>
          <p className="text-ink-soft mb-3 text-lg italic">{tavern.atmosphere}.</p>
          <div className="space-y-1">
            <Line label="Oste">{tavern.keeper.name}, {ANCESTRY_LABELS[tavern.keeper.ancestry].toLowerCase()}: {tavern.keeper.manner}.</Line>
            <Line label="Piatto del giorno">{tavern.dish}.</Line>
            <Line label="Da bere">{tavern.drink}.</Line>
            <Line label="Si sente dire">«{tavern.rumor.text}»</Line>
          </div>
          <DmOnly label="La voce è">{tavern.rumor.truth}.</DmOnly>
          <ResultActions
            onRegenerate={generate}
            save={
              save
                ? () =>
                    save({
                      title: tavern.name,
                      kind: 'place',
                      body: `*${tavern.atmosphere}.*\n\n- **Oste**: ${tavern.keeper.name} — ${tavern.keeper.manner}; ${tavern.keeper.voice}.\n- **Piatto del giorno**: ${tavern.dish}.\n- **Da bere**: ${tavern.drink}.\n- **Si sente dire**: «${tavern.rumor.text}» (_${tavern.rumor.truth}_)`,
                    })
                : undefined
            }
            saveLabel="Salva come nota"
            openHref={(id) => `/note/${id}`}
          />
        </>
      )}
    </section>
  );
}

/* ── Bottega ──────────────────────────────────────────────────────── */

function ShopCard({ equipment, save }: { equipment: ShopStock[]; save?: Savers['saveNote'] }) {
  const [shop, setShop] = useState<GeneratedShop | null>(null);
  const generate = () => setShop(generateShop(Math.random, equipment));

  return (
    <section className={cardClass}>
      {!shop ? (
        <StartButton onClick={generate} label="Genera una bottega" />
      ) : (
        <>
          <h2 className="text-gold text-3xl">{shop.name}</h2>
          <p className="text-ink-soft mb-3 text-lg italic">
            {shop.keeper.name}, {shop.keeper.manner}. Il bottegaio {shop.quirk}.
          </p>
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b-gold-soft small-caps text-gold border-b">
                <th className="py-1.5 pr-3">Merce</th>
                <th className="py-1.5 text-right">Prezzo</th>
              </tr>
            </thead>
            <tbody>
              {shop.items.map((item) => (
                <tr key={item.slug} className="border-border/50 border-b">
                  <td className="py-1.5 pr-3">
                    <Link href={`/oggetti/e-${item.slug}`} className="text-ink hover:text-gold" target="_blank">{item.name}</Link>
                  </td>
                  <td className="text-ink-soft py-1.5 text-right font-mono tabular-nums">{price(item.costValue, item.costUnit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-ink-faint mt-2 text-sm">Prezzi del manuale (SRD). mo = monete d’oro, ma = d’argento, mr = di rame.</p>
          <ResultActions
            onRegenerate={generate}
            save={
              save
                ? () =>
                    save({
                      title: shop.name,
                      kind: 'place',
                      body: `*${shop.keeper.name}, ${shop.keeper.manner}. Il bottegaio ${shop.quirk}.*\n\n| Merce | Prezzo |\n|---|---|\n${shop.items.map((i) => `| ${i.name} | ${price(i.costValue, i.costUnit)} |`).join('\n')}`,
                    })
                : undefined
            }
            saveLabel="Salva come nota"
            openHref={(id) => `/note/${id}`}
          />
        </>
      )}
    </section>
  );
}

/* ── Voce di paese ────────────────────────────────────────────────── */

function RumorCard({ save }: { save?: Savers['saveNote'] }) {
  const [rumor, setRumor] = useState<GeneratedRumor | null>(null);
  const generate = () => setRumor(generateRumor(Math.random));

  return (
    <section className={cardClass}>
      {!rumor ? (
        <StartButton onClick={generate} label="Genera una voce di paese" />
      ) : (
        <>
          <p className="text-ink text-2xl leading-relaxed italic">«{rumor.text}»</p>
          <DmOnly label="La voce è">{rumor.truth}.</DmOnly>
          <ResultActions
            onRegenerate={generate}
            save={save ? () => save({ title: `Voce: ${rumor.text.slice(0, 60).replace(/[[\]|]/g, '')}${rumor.text.length > 60 ? '…' : ''}`, kind: 'plot', body: `«${rumor.text}»\n\n_Verità (solo DM): ${rumor.truth}._` }) : undefined}
            saveLabel="Salva come nota"
            openHref={(id) => `/note/${id}`}
          />
        </>
      )}
    </section>
  );
}

/* ── Spunto ───────────────────────────────────────────────────────── */

function HookCard({ save }: { save?: Savers['saveNote'] }) {
  const [hook, setHook] = useState<GeneratedHook | null>(null);
  const generate = () => setHook(generateHook(Math.random));

  return (
    <section className={cardClass}>
      {!hook ? (
        <StartButton onClick={generate} label="Genera uno spunto narrativo" />
      ) : (
        <>
          <p className="text-ink text-2xl leading-relaxed">
            {hook.who} chiede al gruppo di <strong className="text-gold">{hook.what}</strong>, perché {hook.why}.
          </p>
          <DmOnly label="La complicazione">Ma {hook.twist}.</DmOnly>
          <ResultActions
            onRegenerate={generate}
            save={save ? () => save({ title: `Spunto: ${hook.what}`, kind: 'plot', body: `${hook.who} chiede al gruppo di **${hook.what}**, perché ${hook.why}.\n\n**Complicazione**: ma ${hook.twist}.` }) : undefined}
            saveLabel="Salva come nota"
            openHref={(id) => `/note/${id}`}
          />
        </>
      )}
    </section>
  );
}

/* ── Incontro ─────────────────────────────────────────────────────── */

const DIFFICULTIES: Difficulty[] = ['facile', 'impegnativo', 'duro', 'letale'];

function EncounterCard({
  monsters,
  party,
  save,
}: {
  monsters: EncounterCandidate[];
  party: { level: number; size: number };
  save?: Savers['saveEncounter'];
}) {
  const [target, setTarget] = useState<Difficulty>('impegnativo');
  const [type, setType] = useState('');
  // Senza PG nella campagna si parte da un gruppo tipico: quattro personaggi di livello 1.
  const [level, setLevel] = useState(party.size > 0 ? party.level : 1);
  const [size, setSize] = useState(party.size > 0 ? party.size : 4);
  const [result, setResult] = useState<GeneratedEncounter | null | 'none'>(null);

  const types = [...new Set(monsters.map((m) => m.type))].sort();
  const generate = () => setResult(generateEncounter(Math.random, monsters, { level, size }, target, type ? { type } : {}) ?? 'none');

  return (
    <section className={cardClass}>
      <div className="text-ink-soft mb-4 flex flex-wrap items-center gap-4 text-base">
        <label className="flex items-center gap-2">
          Difficoltà
          <select value={target} onChange={(e) => setTarget(e.target.value as Difficulty)} className="panel text-ink px-2 py-1.5 outline-none">
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_INFO[d].label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Tipo
          <select value={type} onChange={(e) => setType(e.target.value)} className="panel text-ink px-2 py-1.5 outline-none">
            <option value="">qualsiasi</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          PG
          <input type="number" min={1} max={10} value={size} onChange={(e) => setSize(Number(e.target.value) || 1)} className="panel text-ink w-16 px-2 py-1.5 font-mono outline-none" />
        </label>
        <label className="flex items-center gap-2">
          di livello
          <input type="number" min={1} max={20} value={level} onChange={(e) => setLevel(Number(e.target.value) || 1)} className="panel text-ink w-16 px-2 py-1.5 font-mono outline-none" />
        </label>
      </div>

      {result === null ? (
        <StartButton onClick={generate} label="Genera un incontro" />
      ) : result === 'none' ? (
        <>
          <p className="text-ink-soft text-lg">Nessun mostro adatto con questi filtri. Prova un altro tipo.</p>
          <ResultActions onRegenerate={generate} saveLabel="" openHref={() => ''} />
        </>
      ) : (
        <>
          <ul className="space-y-1">
            {result.entries.map((entry) => (
              <li key={entry.slug} className="text-ink text-xl">
                <span className="text-gold font-mono">{entry.count}×</span>{' '}
                <Link href={`/bestiario/${entry.slug}`} target="_blank" className="hover:text-gold">{entry.name}</Link>
              </li>
            ))}
          </ul>
          {result.evaluation.difficulty && (
            <p className="text-ink-soft mt-3 text-base">
              Stima: <strong className="text-gold">{DIFFICULTY_INFO[result.evaluation.difficulty].label}</strong> — rapporto{' '}
              {result.evaluation.ratio.toLocaleString('it-IT')}, {result.evaluation.totalXp.toLocaleString('it-IT')} PE.
              {!result.exact && ' Non ho trovato una combinazione esatta: questa è la più vicina.'}
            </p>
          )}
          <p className="text-ink-faint mt-1 text-sm">Stessa stima del costruttore di scontri (stima dell’app, non regola ufficiale).</p>
          <ResultActions
            onRegenerate={generate}
            save={save ? () => save({ name: `Incontro ${DIFFICULTY_INFO[target].label.toLowerCase()}: ${result.entries.map((e) => e.name).join(' e ')}`, entries: result.entries.map((e) => ({ slug: e.slug, count: e.count })) }) : undefined}
            saveLabel="Salva come scontro"
            openHref={(id) => `/scontri/${id}`}
          />
        </>
      )}
    </section>
  );
}

/* ── Tesoro ───────────────────────────────────────────────────────── */

function TreasureCard({ magicItems, defaultLevel, save }: { magicItems: TreasureItem[]; defaultLevel: number; save?: Savers['saveNote'] }) {
  const [level, setLevel] = useState(defaultLevel);
  const [treasure, setTreasure] = useState<GeneratedTreasure | null>(null);
  const generate = () => setTreasure(generateTreasure(Math.random, level, magicItems));

  return (
    <section className={cardClass}>
      <label className="text-ink-soft mb-4 flex items-center gap-2 text-base">
        Livello del gruppo
        <input type="number" min={1} max={20} value={level} onChange={(e) => setLevel(Number(e.target.value) || 1)} className="panel text-ink w-16 px-2 py-1.5 font-mono outline-none" />
      </label>

      {!treasure ? (
        <StartButton onClick={generate} label="Genera un tesoro" />
      ) : (
        <>
          <p className="text-gold font-mono text-3xl">
            {treasure.coins.oro} mo · {treasure.coins.argento} ma · {treasure.coins.rame} mr
          </p>
          {treasure.items.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {treasure.items.map((item) => (
                <li key={item.slug} className="text-ink text-xl">
                  ✦ <Link href={`/oggetti/m-${item.slug}`} target="_blank" className="hover:text-gold">{item.name}</Link>{' '}
                  <span className="text-ink-faint text-base">({item.rarity})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-soft mt-3 text-base">Nessun oggetto magico, questa volta.</p>
          )}
          <p className="text-ink-faint mt-3 text-sm">Formula dell’app: le tabelle dei tesori della Guida del DM non fanno parte dell’SRD.</p>
          <ResultActions
            onRegenerate={generate}
            save={save ? () => save({ title: `Tesoro (livello ${level})`, kind: 'other', body: `**Monete**: ${treasure.coins.oro} mo, ${treasure.coins.argento} ma, ${treasure.coins.rame} mr.\n\n${treasure.items.map((i) => `- ${i.name} (${i.rarity})`).join('\n')}` }) : undefined}
            saveLabel="Salva come nota"
            openHref={(id) => `/note/${id}`}
          />
        </>
      )}
    </section>
  );
}

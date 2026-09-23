'use server';

import { and, asc, desc, eq, isNotNull, isNull, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { characters, combatEvents, encounterMonsters, encounters } from '@/db/schema';
import { abilityModifier } from '@/core/rules';
import { roll } from '@/core/dice';
import type { CombatEvent } from '@/core/events';
import { clientCombatEventSchema } from './schema';

/**
 * Avvia il combattimento di uno scontro (SPEC-0007 AC1–AC3).
 *
 * Scrive gli eventi di preparazione, marcati `setup` perché l'annulla non li tocchi:
 * i PG della campagna entrano da soli, i mostri entrano numerati, con l'iniziativa già tirata
 * e i punti ferita medi oppure tirati dai dadi vita.
 */
export async function startCombat(encounterId: number, formData: FormData): Promise<void> {
  const encounter = db.select().from(encounters).where(eq(encounters.id, encounterId)).get();
  if (!encounter) redirect('/scontri');

  // Già in corso: si riprende, non si ricomincia da capo perdendo tutto.
  if (encounter.status === 'running') redirect(`/combattimento/${encounterId}`);

  const rollHp = formData.get('hpMode') === 'rolled';

  const pcs = db
    .select()
    .from(characters)
    .where(
      and(
        eq(characters.campaignId, encounter.campaignId),
        eq(characters.kind, 'pc'),
        eq(characters.archived, false),
      ),
    )
    .orderBy(asc(characters.name))
    .all();

  const monsters = db
    .select()
    .from(encounterMonsters)
    .where(eq(encounterMonsters.encounterId, encounterId))
    .orderBy(asc(encounterMonsters.id))
    .all();

  const events: CombatEvent[] = [{ type: 'combat-start' }];

  for (const pc of pcs) {
    // L'iniziativa dei PG resta vuota: la tirano i giocatori, con i loro dadi.
    events.push({
      type: 'combatant-add',
      id: `pc-${pc.id}`,
      name: pc.name,
      kind: 'pc',
      maxHp: pc.maxHp,
      ac: pc.ac,
      initiativeMod: abilityModifier(pc.dex),
      characterId: pc.id,
    });
  }

  for (const monster of monsters) {
    for (let copy = 1; copy <= monster.count; copy++) {
      const hp = rollHp && monster.hitDice ? Math.max(1, safeRoll(monster.hitDice) ?? monster.hp) : monster.hp;
      events.push({
        type: 'combatant-add',
        id: `m-${monster.id}-${copy}`,
        name: monster.count > 1 ? `${monster.name} ${copy}` : monster.name,
        kind: 'monster',
        maxHp: hp,
        ac: monster.ac,
        initiativeMod: monster.initiativeMod,
        initiative: (safeRoll('1d20') ?? 10) + monster.initiativeMod,
        srdMonsterSlug: monster.srdMonsterSlug,
      });
    }
  }

  db.transaction((tx) => {
    // Uno scontro concluso che si rigioca riparte pulito.
    tx.delete(combatEvents).where(eq(combatEvents.encounterId, encounterId)).run();
    tx.insert(combatEvents)
      .values(
        events.map((event, index) => ({
          encounterId,
          seq: index + 1,
          type: event.type,
          payload: { ...event, setup: true },
        })),
      )
      .run();
    tx.update(encounters).set({ status: 'running', updatedAt: new Date() }).where(eq(encounters.id, encounterId)).run();
  });

  revalidatePath('/scontri');
  revalidatePath(`/scontri/${encounterId}`);
  revalidatePath('/combattimento');
  redirect(`/combattimento/${encounterId}`);
}

function safeRoll(notation: string): number | null {
  try {
    return roll(notation).total;
  } catch {
    return null;
  }
}

/**
 * Registra un'azione del DM.
 *
 * Un evento nuovo dopo un annulla **scarta definitivamente** gli eventi annullati, come in un
 * editor di testo: da lì la storia prende un'altra strada.
 */
export async function appendCombatEvent(encounterId: number, raw: unknown): Promise<{ error?: string }> {
  const parsed = clientCombatEventSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Azione non valida.' };

  const encounter = db.select({ status: encounters.status }).from(encounters).where(eq(encounters.id, encounterId)).get();
  if (encounter?.status !== 'running') return { error: 'Questo combattimento non è in corso.' };

  db.transaction((tx) => {
    tx.delete(combatEvents)
      .where(and(eq(combatEvents.encounterId, encounterId), isNotNull(combatEvents.undoneAt)))
      .run();

    const last = tx
      .select({ seq: max(combatEvents.seq) })
      .from(combatEvents)
      .where(eq(combatEvents.encounterId, encounterId))
      .get();

    tx.insert(combatEvents)
      .values({ encounterId, seq: (last?.seq ?? 0) + 1, type: parsed.data.type, payload: parsed.data })
      .run();
  });

  return {};
}

/** Annulla l'ultima azione del DM. Gli eventi di preparazione non si toccano. */
export async function undoCombatEvent(encounterId: number): Promise<{ error?: string }> {
  const recent = db
    .select({ id: combatEvents.id, payload: combatEvents.payload })
    .from(combatEvents)
    .where(and(eq(combatEvents.encounterId, encounterId), isNull(combatEvents.undoneAt)))
    .orderBy(desc(combatEvents.seq))
    .limit(1)
    .all();

  const target = recent[0];
  if (!target || (target.payload as { setup?: boolean }).setup === true) {
    return { error: 'Non c’è nulla da annullare.' };
  }

  db.update(combatEvents).set({ undoneAt: new Date() }).where(eq(combatEvents.id, target.id)).run();
  return {};
}

/** Chiude il combattimento: lo scontro passa a «concluso» (AC23). */
export async function endCombat(encounterId: number): Promise<void> {
  db.update(encounters).set({ status: 'done', updatedAt: new Date() }).where(eq(encounters.id, encounterId)).run();
  revalidatePath('/scontri');
  revalidatePath(`/scontri/${encounterId}`);
  revalidatePath('/combattimento');
  redirect(`/scontri/${encounterId}`);
}

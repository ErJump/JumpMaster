import 'server-only';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { encounters, encounterMonsters, monsters as allMonsters, type Encounter, type EncounterMonster } from '@/db/schema';
import { abilityModifier } from '@/core/rules';

export function listEncounters(campaignId: number): Array<Encounter & { monsterCount: number; totalXp: number }> {
  const rows = db
    .select()
    .from(encounters)
    .where(eq(encounters.campaignId, campaignId))
    .orderBy(desc(encounters.updatedAt))
    .all();

  if (rows.length === 0) return [];

  const monsters = db
    .select()
    .from(encounterMonsters)
    .where(inArray(encounterMonsters.encounterId, rows.map((row) => row.id)))
    .all();

  return rows.map((row) => {
    const own = monsters.filter((monster) => monster.encounterId === row.id);
    return {
      ...row,
      monsterCount: own.reduce((sum, monster) => sum + monster.count, 0),
      totalXp: own.reduce((sum, monster) => sum + monster.xp * monster.count, 0),
    };
  });
}

export function getEncounter(id: number): { encounter: Encounter; monsters: EncounterMonster[] } | undefined {
  const encounter = db.select().from(encounters).where(eq(encounters.id, id)).get();
  if (!encounter) return undefined;

  const monsters = db
    .select()
    .from(encounterMonsters)
    .where(eq(encounterMonsters.encounterId, id))
    .orderBy(asc(encounterMonsters.id))
    .all();

  return { encounter, monsters };
}

export interface CatalogMonster {
  slug: string;
  name: string;
  type: string;
  size: string;
  cr: number;
  crLabel: string;
  xp: number;
  hp: number;
  ac: number;
  initiativeMod: number;
  hitDice: string | null;
}

/**
 * Il catalogo per il selettore: tutti i mostri (SRD e fonti aperte) con quanto serve a comporre uno scontro.
 *
 * La Destrezza sta nel payload JSON: `json_extract` la legge in SQL invece di
 * deserializzare migliaia di stat block completi solo per un numero.
 */
export function monsterCatalog(): CatalogMonster[] {
  return db
    .select({
      slug: allMonsters.slug,
      name: allMonsters.name,
      type: allMonsters.type,
      size: allMonsters.size,
      cr: allMonsters.cr,
      crLabel: allMonsters.crLabel,
      xp: allMonsters.xp,
      hp: allMonsters.hp,
      ac: allMonsters.ac,
      dexterity: sql<number>`json_extract(${allMonsters.data}, '$.dexterity')`,
      hitDice: allMonsters.hitDice,
    })
    .from(allMonsters)
    .orderBy(asc(allMonsters.name))
    .all()
    .map(({ dexterity, ...monster }) => ({
      ...monster,
      initiativeMod: abilityModifier(typeof dexterity === 'number' ? dexterity : 10),
    }));
}

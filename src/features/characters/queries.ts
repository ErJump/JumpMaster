import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { characters, type Character } from '@/db/schema';
import { deriveCharacter, type DerivedCharacter } from './derive';

/**
 * Le query ricevono `campaignId` invece di leggerlo da sole.
 *
 * L'invariante I2 vieta a una slice di importarne un'altra: è il livello `app/` a conoscere
 * la campagna attiva e a passarla. Così `characters` non sa nulla di `campaigns` e resta
 * riusabile e testabile in isolamento.
 */
export function listCharacters(campaignId: number, kind?: 'pc' | 'npc'): Character[] {
  return db
    .select()
    .from(characters)
    .where(
      kind
        ? and(eq(characters.campaignId, campaignId), eq(characters.kind, kind))
        : eq(characters.campaignId, campaignId),
    )
    .orderBy(asc(characters.name))
    .all();
}

export function getCharacter(id: number): Character | undefined {
  return db.select().from(characters).where(eq(characters.id, id)).get();
}

/** Il gruppo: i personaggi giocanti, con tutti i valori derivati già calcolati. */
export function listParty(campaignId: number): DerivedCharacter[] {
  return listCharacters(campaignId, 'pc').map(deriveCharacter);
}

/**
 * Livello medio e dimensione del gruppo: è il riferimento del costruttore di scontri
 * (SPEC-0006 AC5), preso dai personaggi veri e non da un numero digitato a mano.
 */
export function partyProfile(campaignId: number): { level: number; size: number } {
  const party = listCharacters(campaignId, 'pc');
  if (party.length === 0) return { level: 1, size: 0 };

  const total = party.reduce((sum, character) => sum + character.level, 0);
  return { level: Math.round(total / party.length), size: party.length };
}

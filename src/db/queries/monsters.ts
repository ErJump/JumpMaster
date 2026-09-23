/**
 * Da dove viene un mostro (ADR-0013). Lo chiedono il bestiario e il combat tracker, per la riga
 * «Fonte» sotto lo stat block: sta nel livello dati condiviso (invariante I7).
 */
import 'server-only';
import { inArray } from 'drizzle-orm';
import { db } from '../client';
import { monsters, open5eDocuments, open5eLicenses } from '../schema';
import type { MonsterSource } from '@/lib/srd-types';

export const SRD_SOURCE: MonsterSource = {
  title: 'System Reference Document 5.1',
  publisher: 'Wizards of the Coast',
  href: 'https://dnd.wizards.com/resources/systems-reference-document',
  licenses: [{ name: 'CC-BY-4.0', href: 'https://creativecommons.org/licenses/by/4.0/legalcode.it' }],
};

/** La fonte di ogni mostro richiesto. Uno slug sconosciuto semplicemente non compare. */
export function monsterSources(slugs: readonly string[]): Record<string, MonsterSource> {
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return {};

  const rows = db.select({ slug: monsters.slug, source: monsters.source }).from(monsters).where(inArray(monsters.slug, unique)).all();
  const documentKeys = [...new Set(rows.map((r) => r.source).filter((s) => s !== 'srd'))];
  const documents = documentKeys.length ? db.select().from(open5eDocuments).where(inArray(open5eDocuments.key, documentKeys)).all() : [];
  const licenseKeys = [...new Set(documents.flatMap((d) => d.licenses as string[]))];
  const licenseNames = new Map(
    (licenseKeys.length ? db.select({ key: open5eLicenses.key, name: open5eLicenses.name }).from(open5eLicenses).where(inArray(open5eLicenses.key, licenseKeys)).all() : []).map(
      (l) => [l.key, l.name],
    ),
  );

  const byDocument = new Map<string, MonsterSource>(
    documents.map((d) => [
      d.key,
      {
        title: d.name,
        publisher: d.publisher,
        href: d.permalink ?? undefined,
        via: 'Open5e',
        licenses: (d.licenses as string[]).map((key) => ({ name: licenseNames.get(key) ?? key, href: `/fonti/licenze/${key}` })),
      },
    ]),
  );

  const out: Record<string, MonsterSource> = {};
  for (const row of rows) {
    const source = row.source === 'srd' ? SRD_SOURCE : byDocument.get(row.source);
    if (source) out[row.slug] = source;
  }
  return out;
}

/** Le fonti presenti, per il filtro del bestiario: prima l'SRD, poi i manuali in ordine di nome. */
export function monsterSourceOptions(): Array<{ value: string; label: string }> {
  const documents = db.select({ key: open5eDocuments.key, name: open5eDocuments.name }).from(open5eDocuments).all();
  return [{ value: 'srd', label: 'SRD 5.1' }, ...documents.sort((a, b) => a.name.localeCompare(b.name)).map((d) => ({ value: d.key, label: d.name }))];
}

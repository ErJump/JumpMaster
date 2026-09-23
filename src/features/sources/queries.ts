import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { open5eDocuments, open5eLicenses } from '@/db/schema';
import { documentUsage, type DocumentUsage } from './install';

export interface InstalledSource {
  key: string;
  name: string;
  publisher: string;
  permalink: string | null;
  monsterCount: number;
  importedAt: Date;
  licenses: Array<{ key: string; name: string }>;
  usage: DocumentUsage;
}

export function installedSources(): InstalledSource[] {
  const licenseNames = new Map(db.select({ key: open5eLicenses.key, name: open5eLicenses.name }).from(open5eLicenses).all().map((l) => [l.key, l.name]));
  return db
    .select()
    .from(open5eDocuments)
    .orderBy(asc(open5eDocuments.name))
    .all()
    .map((d) => ({
      key: d.key,
      name: d.name,
      publisher: d.publisher,
      permalink: d.permalink,
      monsterCount: d.monsterCount,
      importedAt: d.importedAt,
      licenses: (d.licenses as string[]).map((key) => ({ key, name: licenseNames.get(key) ?? key })),
      usage: documentUsage(db, d.key),
    }));
}

export function getLicense(key: string): { name: string; text: string; documents: string[] } | undefined {
  const license = db.select().from(open5eLicenses).where(eq(open5eLicenses.key, key)).get();
  if (!license) return undefined;
  const documents = db
    .select({ name: open5eDocuments.name, licenses: open5eDocuments.licenses })
    .from(open5eDocuments)
    .all()
    .filter((d) => (d.licenses as string[]).includes(key))
    .map((d) => d.name);
  return { name: license.name, text: license.text, documents };
}

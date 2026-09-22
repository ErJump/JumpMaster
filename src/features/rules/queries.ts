import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { srdRuleSections, srdConditions } from '@/db/schema';

/**
 * Regole e condizioni stanno in due tabelle ma per il DM sono la stessa domanda:
 * «si può fare?». Vanno in un unico elenco cercabile.
 */
export type RuleKind = 'regola' | 'condizione';

export interface RuleListItem {
  slug: string;
  name: string;
  kind: RuleKind;
  /** Primo scorcio del testo: aiuta a riconoscere la sezione giusta senza aprirla. */
  excerpt: string;
  /**
   * Testo completo ripulito dal markdown, per la ricerca a pieno testo (SPEC-0003 AC14).
   *
   * Viaggia fino al client — circa 190 KB in tutto — e su un'app servita da localhost
   * non si nota. In cambio il DM che digita «copertura» trova la sezione giusta
   * all'istante, senza un viaggio al server nel mezzo di una discussione al tavolo.
   */
  searchText: string;
}

const CONDITION_PREFIX = 'c-';

/** Toglie i marcatori markdown: il testo che resta è quello su cui si cerca. */
function plainText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*|>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Anteprima breve per l'elenco. */
function excerpt(text: string, length = 90): string {
  const plain = plainText(text.replace(/^#{1,6}\s+.*$/gm, ''));
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

export function listRules(): RuleListItem[] {
  const sections = db
    .select({ slug: srdRuleSections.slug, name: srdRuleSections.name, description: srdRuleSections.description })
    .from(srdRuleSections)
    .orderBy(asc(srdRuleSections.name))
    .all()
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      kind: 'regola' as const,
      excerpt: excerpt(row.description),
      searchText: plainText(row.description),
    }));

  const conditions = db
    .select({ slug: srdConditions.slug, name: srdConditions.name, description: srdConditions.description })
    .from(srdConditions)
    .orderBy(asc(srdConditions.name))
    .all()
    .map((row) => ({
      slug: `${CONDITION_PREFIX}${row.slug}`,
      name: row.name,
      kind: 'condizione' as const,
      excerpt: excerpt(row.description),
      searchText: plainText(row.description),
    }));

  return [...sections, ...conditions];
}

export function getRule(
  prefixedSlug: string,
): { name: string; kind: RuleKind; description: string } | undefined {
  if (prefixedSlug.startsWith(CONDITION_PREFIX)) {
    const row = db
      .select()
      .from(srdConditions)
      .where(eq(srdConditions.slug, prefixedSlug.slice(CONDITION_PREFIX.length)))
      .get();
    return row ? { name: row.name, kind: 'condizione', description: row.description } : undefined;
  }

  const row = db.select().from(srdRuleSections).where(eq(srdRuleSections.slug, prefixedSlug)).get();
  return row ? { name: row.name, kind: 'regola', description: row.description } : undefined;
}

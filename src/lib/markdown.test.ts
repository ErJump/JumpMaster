import { describe, it, expect } from 'vitest';
import { parseInline, parseMarkdown, stripLeadingHeading } from './markdown';

describe('parseInline', () => {
  it('lascia intatto il testo semplice', () => {
    expect(parseInline('niente di speciale')).toStrictEqual([{ kind: 'text', value: 'niente di speciale' }]);
  });

  it('riconosce grassetto, corsivo e la loro combinazione', () => {
    expect(parseInline('**forte**')).toStrictEqual([{ kind: 'strong', value: 'forte' }]);
    expect(parseInline('*lieve*')).toStrictEqual([{ kind: 'em', value: 'lieve' }]);
    expect(parseInline('***entrambi***')).toStrictEqual([{ kind: 'strongEm', value: 'entrambi' }]);
  });

  it('preferisce *** a ** quando entrambi combacerebbero', () => {
    // Senza l'ordine giusto, "***x***" verrebbe letto come grassetto di "*x*".
    expect(parseInline('***x***')[0]).toStrictEqual({ kind: 'strongEm', value: 'x' });
  });

  it('conserva il testo attorno alla formattazione', () => {
    expect(parseInline('un **colpo** critico')).toStrictEqual([
      { kind: 'text', value: 'un ' },
      { kind: 'strong', value: 'colpo' },
      { kind: 'text', value: ' critico' },
    ]);
  });

  it('gestisce più marcature nella stessa riga', () => {
    expect(parseInline('**a** e **b**').filter((n) => n.kind === 'strong')).toHaveLength(2);
  });
});

describe('parseMarkdown', () => {
  it('riconosce i titoli con il loro livello', () => {
    const blocks = parseMarkdown('## Actions in Combat\n\n### Dash');
    expect(blocks[0]).toMatchObject({ kind: 'heading', level: 2 });
    expect(blocks[1]).toMatchObject({ kind: 'heading', level: 3 });
  });

  it('unisce le righe consecutive in un solo paragrafo', () => {
    const blocks = parseMarkdown('prima riga\nseconda riga\n\nnuovo paragrafo');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ kind: 'paragraph' });
    expect((blocks[0] as { content: Array<{ value: string }> }).content[0]?.value).toBe('prima riga seconda riga');
  });

  it('legge le tabelle dell’SRD con intestazione e separatore', () => {
    const table = parseMarkdown(
      ['| Size | Space |', '|------|-------|', '| Tiny | 2.5 by 2.5 ft. |', '| Small | 5 by 5 ft. |'].join('\n'),
    );

    expect(table).toHaveLength(1);
    expect(table[0]).toMatchObject({ kind: 'table' });
    const parsed = table[0] as { headers: unknown[]; rows: unknown[][] };
    expect(parsed.headers).toHaveLength(2);
    expect(parsed.rows).toHaveLength(2);
  });

  it('non scambia per tabella una riga con pipe senza separatore', () => {
    expect(parseMarkdown('| solo una pipe')[0]).toMatchObject({ kind: 'paragraph' });
  });

  it('riconosce elenchi puntati e numerati', () => {
    const bullets = parseMarkdown('- primo\n- secondo');
    expect(bullets[0]).toMatchObject({ kind: 'list', ordered: false });
    expect((bullets[0] as { items: unknown[] }).items).toHaveLength(2);

    const numbered = parseMarkdown('1. primo\n2. secondo');
    expect(numbered[0]).toMatchObject({ kind: 'list', ordered: true });
  });

  it('separa un elenco dal paragrafo che lo precede', () => {
    const blocks = parseMarkdown('Puoi fare questo:\n- una cosa\n- un’altra');
    expect(blocks[0]).toMatchObject({ kind: 'paragraph' });
    expect(blocks[1]).toMatchObject({ kind: 'list' });
  });

  it('non produce blocchi da una stringa vuota', () => {
    expect(parseMarkdown('')).toStrictEqual([]);
    expect(parseMarkdown('\n\n  \n')).toStrictEqual([]);
  });
});

describe('stripLeadingHeading', () => {
  it('toglie il titolo quando il testo lo ripete in cima', () => {
    // Quasi tutte le sezioni SRD iniziano con "## <nome sezione>".
    expect(stripLeadingHeading('## Cover\n\nWalls and trees…', 'Cover')).toBe('Walls and trees…');
  });

  it('ignora maiuscole e spazi', () => {
    expect(stripLeadingHeading('##  cover \n\ntesto', 'Cover')).toBe('testo');
  });

  it('non tocca un titolo diverso dal nome della pagina', () => {
    const source = '## Breaking Up Your Move\n\ntesto';
    expect(stripLeadingHeading(source, 'Movement')).toBe(source);
  });

  it('non tocca un titolo che non è la prima cosa del testo', () => {
    const source = 'un paragrafo\n\n## Cover\n\ntesto';
    expect(stripLeadingHeading(source, 'Cover')).toBe(source);
  });

  it('non tocca un testo senza titoli', () => {
    expect(stripLeadingHeading('solo testo', 'Cover')).toBe('solo testo');
  });
});

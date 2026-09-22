/**
 * Parser markdown minimale per i testi dell'SRD.
 *
 * Perché scritto a mano invece di installare `react-markdown`: il sottoinsieme usato
 * dall'SRD è **chiuso e noto** — titoli, paragrafi, tabelle, elenchi, grassetto e corsivo.
 * Niente link, niente codice, niente citazioni, niente HTML. Aggiungere una libreria di
 * markdown (e il suo albero di dipendenze) per coprire questo significherebbe pagare un
 * debito permanente per un problema che sappiamo già quanto è grande.
 *
 * Funzioni pure: restituiscono una struttura, non JSX. Il rendering sta in `src/ui/`.
 */

export type InlineNode =
  | { kind: 'text'; value: string }
  | { kind: 'strong'; value: string }
  | { kind: 'em'; value: string }
  | { kind: 'strongEm'; value: string };

export type Block =
  | { kind: 'heading'; level: number; content: InlineNode[] }
  | { kind: 'paragraph'; content: InlineNode[] }
  | { kind: 'list'; ordered: boolean; items: InlineNode[][] }
  | { kind: 'table'; headers: InlineNode[][]; rows: InlineNode[][][] };

/* ── inline ───────────────────────────────────────────────────────── */

// L'ordine conta: *** va tentato prima di ** e di *, altrimenti vince il più corto.
const INLINE_PATTERN = /(\*\*\*(?:[^*]|\*(?!\*\*))+\*\*\*|\*\*(?:[^*]|\*(?!\*))+\*\*|\*[^*\n]+\*)/g;

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const token = match[0];
    const start = match.index;

    if (start > lastIndex) {
      nodes.push({ kind: 'text', value: text.slice(lastIndex, start) });
    }

    if (token.startsWith('***')) nodes.push({ kind: 'strongEm', value: token.slice(3, -3) });
    else if (token.startsWith('**')) nodes.push({ kind: 'strong', value: token.slice(2, -2) });
    else nodes.push({ kind: 'em', value: token.slice(1, -1) });

    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return nodes;
}

/* ── blocchi ──────────────────────────────────────────────────────── */

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+\.\s+(.*)$/;
const TABLE_SEPARATOR = /^\s*\|?[\s:|-]+\|[\s:|-]*$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.split('\n');
  const blocks: Block[] = [];

  let paragraph: string[] = [];

  function flushParagraph(): void {
    if (paragraph.length === 0) return;
    blocks.push({ kind: 'paragraph', content: parseInline(paragraph.join(' ')) });
    paragraph = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ kind: 'heading', level: heading[1]!.length, content: parseInline(heading[2]!) });
      continue;
    }

    // Tabella: la riga corrente ha le pipe e la successiva è il separatore.
    if (line.trim().startsWith('|') && TABLE_SEPARATOR.test(lines[i + 1] ?? '')) {
      flushParagraph();
      const headers = splitRow(line).map(parseInline);
      const rows: InlineNode[][][] = [];

      i += 2; // salta intestazione e separatore
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        rows.push(splitRow(lines[i]!).map(parseInline));
        i++;
      }
      i--; // il ciclo esterno incrementerà

      blocks.push({ kind: 'table', headers, rows });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = numbered !== null;
      const items: InlineNode[][] = [];

      while (i < lines.length) {
        const current = lines[i] ?? '';
        const match = ordered ? NUMBERED.exec(current) : BULLET.exec(current);
        if (!match) break;
        items.push(parseInline(match[1]!));
        i++;
      }
      i--;

      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  return blocks;
}

/**
 * Toglie il titolo ripetuto in cima al testo.
 *
 * Quasi tutte le sezioni dell'SRD cominciano con `## <nome della sezione>`, cioè
 * esattamente il titolo che la pagina mostra già di suo. Lasciarlo significherebbe
 * far leggere lo stesso titolo due volte di fila.
 */
export function stripLeadingHeading(source: string, title: string): string {
  const match = /^\s*#{1,6}\s+(.*)$/m.exec(source);
  if (!match || match.index !== 0) return source;
  if (match[1]!.trim().toLowerCase() !== title.trim().toLowerCase()) return source;
  return source.slice(match[0].length).replace(/^\s*\n/, '');
}

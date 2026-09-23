/** Rendering dei blocchi prodotti da `@/lib/markdown`. Nessuna logica: solo presentazione. */
import Link from 'next/link';
import { parseMarkdown, type Block, type InlineNode } from '@/lib/markdown';

/**
 * Risolve un collegamento `[[…]]` (SPEC-0009). Chi usa il componente decide dove porta:
 * il componente non sa nulla di note o personaggi. Senza risolutore, i collegamenti restano testo.
 */
export type LinkResolver = (target: string) => { href: string; missing: boolean };

const HEADING_CLASS: Record<number, string> = {
  1: 'text-gold text-3xl mt-8 mb-2',
  2: 'text-gold text-2xl mt-8 mb-2',
  3: 'text-gold text-xl mt-6 mb-1.5',
  4: 'text-ink text-lg mt-5 mb-1 small-caps',
  5: 'text-ink-soft text-base mt-4 mb-1 small-caps',
  6: 'text-ink-soft text-base mt-4 mb-1 small-caps',
};

function Inline({ nodes, resolve }: { nodes: InlineNode[]; resolve?: LinkResolver }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case 'wikilink': {
            if (!resolve) return <span key={index}>{node.value}</span>;
            const { href, missing } = resolve(node.target);
            return (
              <Link
                key={index}
                href={href}
                title={missing ? `«${node.target}» non esiste ancora: clicca per crearla` : node.target}
                className={
                  missing
                    ? 'text-wax decoration-wax/60 underline decoration-dashed underline-offset-2'
                    : 'text-gold decoration-gold-soft underline underline-offset-2'
                }
              >
                {node.value}
              </Link>
            );
          }
          case 'strong':
            return (
              <strong key={index} className="text-ink font-semibold">
                {node.value}
              </strong>
            );
          case 'em':
            return (
              <em key={index} className="italic">
                {node.value}
              </em>
            );
          case 'strongEm':
            return (
              <strong key={index} className="text-ink font-semibold italic">
                {node.value}
              </strong>
            );
          default:
            return <span key={index}>{node.value}</span>;
        }
      })}
    </>
  );
}

function BlockView({ block, resolve, compact }: { block: Block; resolve?: LinkResolver; compact?: boolean }) {
  switch (block.kind) {
    case 'heading': {
      const Tag = (['h2', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)[block.level - 1] ?? 'h4';
      return (
        <Tag className={HEADING_CLASS[block.level] ?? HEADING_CLASS[4]}>
          <Inline nodes={block.content} resolve={resolve} />
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p className={`text-ink leading-relaxed ${compact ? 'my-0' : 'my-3'}`}>
          <Inline nodes={block.content} resolve={resolve} />
        </p>
      );

    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag
          className={`text-ink my-3 space-y-1.5 pl-6 leading-relaxed ${
            block.ordered ? 'list-decimal' : 'list-disc'
          } marker:text-gold-soft`}
        >
          {block.items.map((item, index) => (
            <li key={index}>
              <Inline nodes={item} resolve={resolve} />
            </li>
          ))}
        </Tag>
      );
    }

    case 'table':
      return (
        <div className="my-5 overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b-gold-soft border-b">
                {block.headers.map((header, index) => (
                  <th key={index} className="small-caps text-gold px-3 py-2 font-semibold">
                    <Inline nodes={header} resolve={resolve} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-border/60 even:bg-surface-raised/40 border-b">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="text-ink px-3 py-1.5">
                      <Inline nodes={cell} resolve={resolve} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/**
 * @param compact Per le voci brevi (elenchi, segreti): i paragrafi perdono i margini, così il
 *   testo resta allineato alla casella o al punto elenco che lo precede.
 */
export function Markdown({
  source,
  resolveLink,
  compact = false,
}: {
  source: string;
  resolveLink?: LinkResolver;
  compact?: boolean;
}) {
  const blocks = parseMarkdown(source);
  return (
    <div>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} resolve={resolveLink} compact={compact} />
      ))}
    </div>
  );
}

/** Rendering dei blocchi prodotti da `@/lib/markdown`. Nessuna logica: solo presentazione. */
import { parseMarkdown, type Block, type InlineNode } from '@/lib/markdown';

const HEADING_CLASS: Record<number, string> = {
  1: 'text-gold text-3xl mt-8 mb-2',
  2: 'text-gold text-2xl mt-8 mb-2',
  3: 'text-gold text-xl mt-6 mb-1.5',
  4: 'text-ink text-lg mt-5 mb-1 small-caps',
  5: 'text-ink-soft text-base mt-4 mb-1 small-caps',
  6: 'text-ink-soft text-base mt-4 mb-1 small-caps',
};

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.kind) {
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

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'heading': {
      const Tag = (['h2', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)[block.level - 1] ?? 'h4';
      return (
        <Tag className={HEADING_CLASS[block.level] ?? HEADING_CLASS[4]}>
          <Inline nodes={block.content} />
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p className="text-ink my-3 leading-relaxed">
          <Inline nodes={block.content} />
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
              <Inline nodes={item} />
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
                    <Inline nodes={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-border/60 even:bg-surface-raised/40 border-b">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="text-ink px-3 py-1.5">
                      <Inline nodes={cell} />
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

export function Markdown({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}

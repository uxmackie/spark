import { createProcessor } from '@mdx-js/mdx'

// Parse only: never compile or evaluate author-supplied JavaScript in the editor.
const processor = createProcessor()
export type MdxNode = {
  type: string; name?: string; value?: string; depth?: number; lang?: string; meta?: string;
  url?: string; alt?: string; title?: string; ordered?: boolean; start?: number;
  children?: MdxNode[]; attributes?: { type: string; name?: string; value?: unknown; position?: { start: { offset: number }; end: { offset: number } } }[];
  position?: { start: { offset: number }; end: { offset: number } };
}
export type SourceBlock = { node: MdxNode; start: number; end: number; source: string }
export function parseMdx(source: string): { blocks: SourceBlock[]; error: string | null } {
  try {
    const tree = processor.parse(source) as unknown as MdxNode
    return { blocks: (tree.children ?? []).map(node => ({ node, start: node.position!.start.offset, end: node.position!.end.offset, source: source.slice(node.position!.start.offset, node.position!.end.offset) })), error: null }
  } catch (error) { return { blocks: [], error: error instanceof Error ? error.message : 'Invalid MDX' } }
}
export function replaceBlock(source: string, block: SourceBlock, replacement: string) {
  return source.slice(0, block.start) + replacement + source.slice(block.end)
}
export function moveBlock(source: string, blocks: SourceBlock[], index: number, direction: -1 | 1) {
  const other = index + direction
  if (!blocks[index] || !blocks[other]) return source
  const a = blocks[Math.min(index, other)], b = blocks[Math.max(index, other)]
  return source.slice(0, a.start) + b.source + source.slice(a.end, b.start) + a.source + source.slice(b.end)
}
export const componentCatalog = [
  { name: 'Paragraph', category: 'Writing', description: 'A little room for your ideas.', source: 'Write something worth sharing.' },
  { name: 'Heading', category: 'Writing', description: 'Give your page structure.', source: '## A new section' },
  { name: 'List', category: 'Writing', description: 'Make the details easy to scan.', source: '- First item\n- Second item\n- Third item' },
  { name: 'Code', category: 'Writing', description: 'Keep the language and filename.', source: '```typescript example.ts\nconst spark = "hello world"\n```' },
  { name: 'Quote', category: 'Writing', description: 'Let a thought stand out.', source: '> Every idea starts with a spark.' },
  { name: 'Divider', category: 'Writing', description: 'Create a quiet pause.', source: '---' },
  ...['Note', 'Info', 'Tip', 'Warning', 'Check', 'Danger'].map(name => ({ name, category: 'Callouts', description: `${name} with Markdown inside.`, source: `<${name}>\n  Something your reader should know.\n</${name}>` })),
  { name: 'Card', category: 'Layout', description: 'A link with a little more context.', source: '<Card title="Explore the guide" icon="book" href="/docs/dev-docs/getting-started">\n  Everything you need to get started.\n</Card>' },
  { name: 'Card group', category: 'Layout', description: 'Responsive cards, side by side.', source: '<CardGroup cols={2}>\n  <Card title="Start here" icon="rocket">\n    Take your first step.\n  </Card>\n  <Card title="Go further" icon="code">\n    Explore what is possible.\n  </Card>\n</CardGroup>' },
  { name: 'Tabs', category: 'Layout', description: 'One space. Multiple perspectives.', source: '<Tabs>\n  <Tab title="Overview">\n    Start with the big picture.\n  </Tab>\n  <Tab title="Details">\n    Get into the details.\n  </Tab>\n</Tabs>' },
  { name: 'Steps', category: 'Layout', description: 'Walk readers through a process.', source: '<Steps>\n  <Step title="Create your project">\n    Give your idea a home.\n  </Step>\n  <Step title="Write your first page">\n    Make something useful.\n  </Step>\n</Steps>' },
  { name: 'Accordion', category: 'Layout', description: 'Details when they are needed.', source: '<Accordion title="Good to know">\n  Add supporting details here.\n</Accordion>' },
  { name: 'Accordion group', category: 'Layout', description: 'Keep related answers together.', source: '<AccordionGroup>\n  <Accordion title="How does this work?">\n    Your answer here.\n  </Accordion>\n  <Accordion title="What comes next?">\n    The next steps.\n  </Accordion>\n</AccordionGroup>' },
  { name: 'Frame', category: 'Media', description: 'An image with a caption.', source: '<Frame caption="Describe your image">\n  ![Image description](/images/spark-cover.png)\n</Frame>' },
  { name: 'Tooltip', category: 'Writing', description: 'An inline explanation on hover or tap.', source: '<Tooltip tip="Add your explanation here">Hover over this text</Tooltip>' },
  { name: 'Emoji', category: 'Writing', description: 'A Font Awesome face or reaction.', source: '<Emoji icon="face-smile" />' },
  { name: 'Badge', category: 'Writing', description: 'A small status label.', source: '<Badge>New</Badge>' },
  { name: 'Columns', category: 'Layout', description: 'A flexible responsive grid.', source: '<Columns cols={2}>\n  <div>First column</div>\n  <div>Second column</div>\n</Columns>' },
] as const

// Normalize only whitespace between top-level syntax nodes. Never touch code,
// component bodies, or whitespace inside a paragraph.
export function tidyBlockSpacing(source: string) {
  const parsed = parseMdx(source)
  return parsed.error ? source : parsed.blocks.map(block => block.source).join('\n\n') + (parsed.blocks.length ? '\n' : '')
}
export function insertBlock(source: string, snippet: string, index: number) {
  const parsed = parseMdx(source)
  if (parsed.error) return source
  const blocks = parsed.blocks.map(block => block.source)
  blocks.splice(Math.max(0, Math.min(index, blocks.length)), 0, snippet)
  return blocks.join('\n\n') + '\n'
}
export function reorderBlock(source: string, from: number, to: number) {
  const { blocks, error } = parseMdx(source)
  if (error || !blocks[from] || to < 0 || to >= blocks.length || from === to) return source
  const values = blocks.map(block => block.source)
  const [moved] = values.splice(from, 1); values.splice(to, 0, moved)
  return values.join('\n\n') + '\n'
}

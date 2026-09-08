import { parseMdx, type MdxNode } from '@/lib/mdx-editor'
import { headingId } from '@/lib/product-config'
export function headingText(node: MdxNode): string {
  return node.type === 'text' || node.type === 'inlineCode' ? node.value ?? '' : node.type === 'image' ? node.alt ?? '' : (node.children ?? []).map(headingText).join('')
}
function scan(nodes: MdxNode[], assign = false) {
  const used = new Set<string>()
  const result: { title: string; id: string; depth: number }[] = []
  const visit = (node: MdxNode) => {
    if (node.type === 'heading') {
      const title = headingText(node), base = headingId(title) || 'section'
      let id = base, suffix = 1
      while (used.has(id)) id = `${base}-${suffix++}`
      used.add(id)
      result.push({ title, id, depth: node.depth ?? 1 })
      if (assign) { const target = node as MdxNode & { data?: { hProperties?: Record<string, unknown> } }; target.data = { ...target.data, hProperties: { ...target.data?.hProperties, id } } }
    }
    node.children?.forEach(visit)
  }
  nodes.forEach(visit)
  return result
}
export function collectHeadings(source: string) { return scan(parseMdx(source).blocks.map(block => block.node)) }
export function headingAnchors() { return (tree: MdxNode) => { scan(tree.children ?? [], true) } }

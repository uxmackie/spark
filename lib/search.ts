import { parseMdx, type MdxNode } from '@/lib/mdx-editor'
export type SearchPage = { product: string; productName: string; slug: string; title: string; description: string; text: string }
export function searchText(source: string) {
  function text(node: MdxNode): string {
    if (['text', 'inlineCode', 'code'].includes(node.type)) return node.value ?? ''
    if (node.type === 'image') return node.alt ?? ''
    return (node.children ?? []).map(text).join(' ')
  }
  return parseMdx(source).blocks.map(b => text(b.node)).join(' ').replace(/\s+/g, ' ').trim()
}
export function searchPages(pages: SearchPage[], query: string, product = '') {
  const terms = [...new Set(query.toLowerCase().trim().split(/\s+/).filter(Boolean))]
  return pages.filter(p => !product || p.product === product).map(page => {
    const title = page.title.toLowerCase(), description = page.description.toLowerCase(), body = page.text.toLowerCase()
    const fields = `${title} ${description} ${body} ${page.slug.toLowerCase()}`
    if (!terms.every(t => fields.includes(t))) return null
    const score = terms.reduce((n, t) => n + (title.includes(t) ? 10 : 0) + (description.includes(t) ? 4 : 0) + (body.includes(t) ? 1 : 0), 0)
    const index = terms.length ? Math.min(...terms.map(t => body.indexOf(t)).filter(i => i >= 0)) : 0
    const start = Number.isFinite(index) ? Math.max(0, index - 65) : 0
    const excerpt = Number.isFinite(index) ? page.text || page.description : page.description || page.text
    return { ...page, score, excerpt: (start ? '…' : '') + excerpt.slice(start, start + 190) + (excerpt.length > start + 190 ? '…' : '') }
  }).filter((p): p is NonNullable<typeof p> => !!p).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 40)
}
export function highlightParts(text: string, query: string) {
  const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))].sort((a,b) => b.length-a.length)
  if (!terms.length) return [{ text, match: false }]
  const pattern = new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi')
  return text.split(pattern).filter(Boolean).map(part => ({ text: part, match: terms.some(t => t.toLowerCase() === part.toLowerCase()) }))
}

import type { ProductConfig, PageInfo } from '@/lib/product-config'
import type { NavigationNode } from '@/lib/navigation'

type Entry = { slug: string; title: string; icon: string; group: string; path: string[] }
export function relatedPages(config: ProductConfig, pages: PageInfo[], current: string, limit = 3) {
  const entries: Entry[] = []
  function visit(nodes: NavigationNode[], path: string[] = [], group = '') {
    for (const node of nodes) {
      if (node.hidden) continue
      if (node.type === 'page' && node.slug) entries.push({ slug: node.slug, title: node.title, icon: node.icon, group, path })
      if (node.children) visit(node.children, [...path, node.id], node.title)
    }
  }
  if (config.navigationTree) visit(config.navigationTree)
  else config.navigation.forEach((group, index) => group.pages.forEach(page => entries.push({ ...page, group: group.group, path: [String(index)] })))
  const available = new Map(pages.map(page => [page.slug, page]))
  const seen = new Set<string>()
  const unique = entries.filter(entry => { if (!available.has(entry.slug) || seen.has(entry.slug)) return false; seen.add(entry.slug); return true })
  const index = unique.findIndex(entry => entry.slug === current)
  const currentPath = unique[index]?.path ?? []
  const affinity = (path: string[]) => { let count = 0; while (count < Math.min(path.length, currentPath.length) && path[count] === currentPath[count]) count++; return count }
  return unique.map((entry, order) => ({ ...entry, description: available.get(entry.slug)!.description, order, affinity: affinity(entry.path) }))
    .filter(entry => entry.slug !== current)
    .sort((a, b) => b.affinity - a.affinity || Math.abs(a.order - index) - Math.abs(b.order - index) || a.order - b.order)
    .slice(0, Math.max(0, Math.min(3, limit)))
}

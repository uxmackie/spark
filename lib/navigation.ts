import { z } from 'zod'
import { iconNames, type ProductIconName } from '@/lib/icon-catalog'
export const navigationKinds = ['tab', 'group', 'page', 'anchor', 'dropdown', 'language', 'version', 'menu'] as const
export type NavigationKind = typeof navigationKinds[number]
export type NavigationNode = { id: string; type: NavigationKind; title: string; icon: ProductIconName; slug?: string; href?: string; hidden?: boolean; children?: NavigationNode[] }
const safeHref = z.string().max(1000).refine(value => !value || (/^(https?:\/\/|\/(?!\/)|#)/i.test(value) && !/[\s\\]/.test(value)), 'Use a site path, anchor, or HTTP(S) URL')
export const navigationNodeSchema: z.ZodType<NavigationNode> = z.lazy(() => z.object({
  id: z.string().min(1).max(100), type: z.enum(navigationKinds), title: z.string().trim().min(1).max(100), icon: z.enum(iconNames),
  slug: z.string().regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/).optional(), href: safeHref.optional(), hidden: z.boolean().optional(), children: z.array(navigationNodeSchema).optional(),
}).superRefine((node, ctx) => {
  if (node.type === 'page' && !node.slug) ctx.addIssue({ code: 'custom', message: 'A page needs a page path' })
  if (['page', 'anchor', 'menu'].includes(node.type) && node.children?.length) ctx.addIssue({ code: 'custom', message: 'This item cannot contain children' })
  if (['anchor', 'menu'].includes(node.type) && !node.href) ctx.addIssue({ code: 'custom', message: 'A link destination is required' })
}))
export const navigationTreeSchema = z.array(navigationNodeSchema).superRefine((nodes, ctx) => {
  const ids = new Set<string>()
  function walk(items: NavigationNode[], depth: number) { for (const node of items) { if (depth > 12 || ids.has(node.id)) { ctx.addIssue({ code: 'custom', message: 'Navigation is too deep or contains duplicate IDs' }); return } ids.add(node.id); walk(node.children ?? [], depth + 1) } }
  walk(nodes, 0)
})
export const isContainer = (node: NavigationNode) => !['page', 'anchor', 'menu'].includes(node.type)
export function flattenNavigation(nodes: NavigationNode[], published = false): NavigationNode[] {
  return nodes.flatMap(node => published && node.hidden ? [] : [node, ...flattenNavigation(node.children ?? [], published)])
}
export function legacyNavigation(groups: { group: string; pages: { slug: string; title: string; icon: ProductIconName }[] }[]): NavigationNode[] {
  return groups.map((group, i) => ({ id: `group-${i}`, type: 'group', title: group.group, icon: 'folder', children: group.pages.map((page, j) => ({ ...page, id: `page-${i}-${j}`, type: 'page' })) }))
}
export function updateNavigation(nodes: NavigationNode[], id: string, update: Partial<NavigationNode>): NavigationNode[] { return nodes.map(node => node.id === id ? { ...node, ...update } : { ...node, ...(node.children ? { children: updateNavigation(node.children, id, update) } : {}) }) }
export function removeNavigation(nodes: NavigationNode[], id: string): NavigationNode[] { return nodes.filter(node => node.id !== id).map(node => ({ ...node, ...(node.children ? { children: removeNavigation(node.children, id) } : {}) })) }
export function insertNavigation(nodes: NavigationNode[], node: NavigationNode, parent: string | null, index?: number): NavigationNode[] {
  if (parent === null) { const result = [...nodes]; result.splice(index ?? result.length, 0, node); return result }
  return nodes.map(item => item.id === parent && isContainer(item) ? { ...item, children: insertNavigation(item.children ?? [], node, null, index) } : { ...item, ...(item.children ? { children: insertNavigation(item.children, node, parent, index) } : {}) })
}
export function moveNavigation(nodes: NavigationNode[], id: string, target: string | null, placement: 'before' | 'after' | 'inside'): NavigationNode[] {
  const found = flattenNavigation(nodes).find(item => item.id === id)
  if (!found || id === target || flattenNavigation([found]).some(item => item.id === target)) return nodes
  const node: NavigationNode = found
  const remaining = removeNavigation(nodes, id)
  if (target === null) return insertNavigation(remaining, node, null)
  function put(items: NavigationNode[]): NavigationNode[] { return items.flatMap(item => {
    if (item.id === target) {
      if (placement === 'inside') return isContainer(item) ? [{ ...item, children: [...(item.children ?? []), node] }] : [item]
      return placement === 'before' ? [node, item] : [item, node]
    }
    return [{ ...item, ...(item.children ? { children: put(item.children) } : {}) }]
  }) }
  const targetNode = flattenNavigation(remaining).find(item => item.id === target)
  if (!targetNode || (placement === 'inside' && !isContainer(targetNode))) return nodes
  return put(remaining)
}
export function renameNavigationPage(nodes: NavigationNode[], oldSlug: string, slug: string, title: string): NavigationNode[] { return nodes.map(node => ({ ...node, ...(node.type === 'page' && node.slug === oldSlug ? { slug, title } : {}), ...(node.children ? { children: renameNavigationPage(node.children, oldSlug, slug, title) } : {}) })) }

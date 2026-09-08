'use client'
import Link from 'next/link'
import { ProductIcon } from './icons'
import { ChevronDown } from '@/components/icons/font-awesome'
import { type NavigationNode } from '@/lib/navigation'
import { pageHref } from '@/lib/product-config'
export function firstNavigationHref(nodes: NavigationNode[], product: string): string | undefined {
  for (const node of nodes) { if (node.hidden) continue; if (node.type === 'page' && node.slug) return pageHref(product, node.slug); if (node.href) return node.href; const child = firstNavigationHref(node.children ?? [], product); if (child) return child }
}
export function PublishedNavigation({ nodes, product, activeSlug, onNavigate }: { nodes: NavigationNode[]; product: string; activeSlug: string; onNavigate: () => void }) {
  return <div className="docs-nested-navigation">{nodes.filter(node => !node.hidden).map(node => {
    if (node.type === 'page' || node.type === 'anchor' || node.type === 'menu') return <Link key={node.id} href={node.type === 'page' ? pageHref(product, node.slug) : node.href ?? '#'} onClick={onNavigate} aria-current={node.type === 'page' && node.slug === activeSlug ? 'page' : undefined} className="docs-nav-page"><ProductIcon name={node.icon} /><span>{node.title}</span></Link>
    return <details key={node.id} open className={`docs-nav-container docs-nav-${node.type}`}><summary><ProductIcon name={node.icon} /><span>{node.title}</span><ChevronDown size={11} /></summary><PublishedNavigation nodes={node.children ?? []} product={product} activeSlug={activeSlug} onNavigate={onNavigate} /></details>
  })}</div>
}

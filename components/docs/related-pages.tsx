import Link from 'next/link'
import { ProductIcon } from './icons'
import { ArrowUpRight } from '@/components/icons/font-awesome'
import { pageHref, type ProductConfig, type PageInfo } from '@/lib/product-config'
import { relatedPages } from '@/lib/related-pages'
export function RelatedPages({ config, pages, current, product }: { config: ProductConfig; pages: PageInfo[]; current: string; product: string }) {
  const related = relatedPages(config, pages, current)
  if (!related.length) return null
  return <section className="docs-related" aria-label="Related pages"><div className="docs-related-heading"><h2>Keep exploring</h2><span>Related pages</span></div><div className="docs-related-grid">{related.map(page => <Link className="docs-related-card" href={pageHref(product, page.slug)} key={page.slug}><div className="docs-related-top"><ProductIcon name={page.icon} className="size-4" /><ArrowUpRight className="size-3" /></div>{page.group && <span className="docs-related-group">{page.group}</span>}<h3>{page.title}</h3>{page.description && <p>{page.description}</p>}</Link>)}</div></section>
}

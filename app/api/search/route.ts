import { getProducts, getPageList, getDocument } from '@/lib/content'
import { flattenNavigation } from '@/lib/navigation'
import { searchText } from '@/lib/search'
export const dynamic = 'force-dynamic'
export async function GET() {
  const products = await getProducts()
  const entries = await Promise.all(products.map(async product => {
    const pages = await getPageList(product.slug)
    const visible = new Set(product.config.navigationTree ? flattenNavigation(product.config.navigationTree, true).filter(n => n.type === 'page').map(n => n.slug) : product.config.navigation.flatMap(g => g.pages.map(p => p.slug)))
    return Promise.all(pages.filter(p => visible.has(p.slug)).map(async page => {
      const document = await getDocument(product.slug, page.slug.split('/'))
      return { ...page, productName: product.config.name, text: document ? searchText(document.source) : '' }
    }))
  }))
  return Response.json({ pages: entries.flat(), products: products.map(p => ({ slug: p.slug, name: p.config.name })) }, { headers: { 'Cache-Control': 'no-store' } })
}

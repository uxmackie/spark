import { notFound, redirect } from 'next/navigation'
import { getProducts } from '@/lib/content'
import { flattenNavigation } from '@/lib/navigation'
import { pageHref } from '@/lib/product-config'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return (await getProducts()).map(product => ({ product: product.slug }))
}

export default async function ProductIndex({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params
  const match = (await getProducts()).find(item => item.slug === product)
  if (!match) notFound()
  const firstPage = match.config.navigationTree ? flattenNavigation(match.config.navigationTree, true).find(node => node.type === 'page')?.slug : match.config.navigation[0]?.pages[0]?.slug
  redirect(pageHref(product, firstPage))
}

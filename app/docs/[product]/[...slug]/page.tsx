import type { Metadata } from 'next'
import { Document } from '@/components/docs/document'
import { getDocument, getPageList, getProducts } from '@/lib/content'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ product: string; slug: string[] }> }

export async function generateStaticParams() {
  const products = await getProducts()
  const routes = await Promise.all(products.map(async product => (await getPageList(product.slug)).map(page => ({ product: product.slug, slug: page.slug.split('/') }))))
  return routes.flat()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product, slug } = await params
  const document = await getDocument(product, slug)
  return { title: document?.title ?? 'Page not found', description: document?.description }
}

export default async function DocPage({ params }: Props) {
  const { product, slug } = await params
  return <Document productSlug={product} segments={slug} />
}

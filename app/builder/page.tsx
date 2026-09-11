import { notFound } from 'next/navigation'
import { getProducts } from '@/lib/content'
import { BuilderWorkspace } from '@/components/builder/workspace'

export const dynamic = 'force-dynamic'

export default async function BuilderPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const products = await getProducts({ includeDrafts: true })
  return <BuilderWorkspace initialProducts={products} />
}

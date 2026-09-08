import { getProducts } from '@/lib/content'
import { sparkIcons } from '@/lib/spark-logo'
import Link from 'next/link'
import { Document } from '@/components/docs/document'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return <div className="relative"><Document productSlug="dev-docs" segments={['index']} /><Link href="/builder" className="fixed bottom-5 right-5 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-lg transition hover:border-primary hover:text-primary">Open Builder</Link></div>
}

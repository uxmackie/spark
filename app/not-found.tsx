import Link from 'next/link'
import { Asterisk, ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"><Asterisk className="size-12 text-primary" /><p className="text-sm text-muted-foreground">404 · A missing spark</p><h1 className="text-balance text-3xl font-semibold tracking-tight">This page is still an idea.</h1><p className="max-w-md text-base leading-relaxed text-muted-foreground">We couldn&apos;t find that document. Head back to the introduction and find your way from there.</p><Link href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}><ArrowLeft data-icon="inline-start" />Back to Spark</Link></main>
}

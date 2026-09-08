import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Asterisk, Braces, Check, FolderGit2, Palette, Rocket } from '@/components/icons/font-awesome'
import { ProductIcon } from '@/components/docs/icons'
import { pageHref, type Product } from '@/lib/product-config'

export function WelcomeBanner() {
  return <div className="not-prose relative isolate flex min-h-52 overflow-hidden rounded-xl border bg-card">
    <Image src="/images/spark-cover.png" alt="Graphite notebooks with a copper spark emblem and ribbon bookmark" fill priority sizes="(max-width: 768px) 100vw, 800px" className="-z-10 object-cover object-center" />
    <div className="flex max-w-[62%] flex-col items-start justify-center gap-4 px-5 py-7 sm:px-8"><Asterisk className="size-9 text-primary" strokeWidth={1.8} /><p className="text-balance text-[25px] font-medium leading-tight tracking-tight text-cover-foreground sm:text-[29px]">All ideas start<br />from a spark.</p><span className="text-sm text-cover-muted">Give yours a place to grow.</span></div>
  </div>
}

const gettingStarted = [
  { title: 'Start your first project', description: 'From a blank canvas to your first page. Let’s get you up and running.', icon: Rocket, slug: 'getting-started' },
  { title: 'Write something great', description: 'Bring your ideas to life with the simplicity of Markdown and MDX.', icon: Braces, slug: 'writing-content' },
  { title: 'Make it your own', description: 'Your colors, your identity. Give every product a personality.', icon: Palette, slug: 'themes' },
  { title: 'Understand the structure', description: 'A simple, file-based foundation that grows right alongside you.', icon: FolderGit2, slug: 'project-structure' },
]

export function GettingStartedCards({ productSlug = 'dev-docs' }: { productSlug?: string }) {
  return <div className="not-prose grid gap-3 sm:grid-cols-2">{gettingStarted.map(card => <Link key={card.slug} href={pageHref(productSlug, card.slug)} className="doc-card group flex flex-col gap-3 rounded-xl border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"><div className="flex items-center justify-between"><card.icon className="size-[22px] text-primary" strokeWidth={1.6} /><ArrowUpRight className="size-4 text-muted-foreground/60 transition-colors group-hover:text-primary" /></div><div className="flex flex-col gap-1.5"><span className="text-[15px] font-medium text-foreground">{card.title}</span><span className="text-sm leading-6 text-muted-foreground">{card.description}</span></div></Link>)}</div>
}

export function ProductCards({ products }: { products: Product[] }) {
  return <div className="not-prose grid gap-3 sm:grid-cols-2">{products.map(product => <Link key={product.slug} href={pageHref(product.slug, product.config.navigation[0]?.pages[0]?.slug)} className="doc-card group flex items-center gap-3 rounded-xl border bg-card/50 p-5 transition-colors hover:border-primary/40"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-primary"><ProductIcon name={product.config.icon} className="size-5" /></span><div className="flex flex-1 flex-col gap-1"><span className="text-sm font-medium text-foreground">{product.config.name}</span><span className="text-sm text-muted-foreground">{product.slug === 'dev-docs' ? 'Build something brilliant.' : 'Get lost in a good story.'}</span></div><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>)}</div>
}

export function Principles() {
  return <div className="not-prose flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">{['MDX-powered', 'Yours by design', 'Ready to deploy'].map(label => <span key={label} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="size-4 text-primary" />{label}</span>)}</div>
}

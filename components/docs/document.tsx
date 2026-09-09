import { literalAttributes } from '@/lib/mdx-literal-attributes'
import { headingAnchors } from '@/lib/headings'
import { Heading } from '@/components/docs/heading'
import Link from 'next/link'
import { flattenNavigation } from '@/lib/navigation'
import { ProductIcon } from '@/components/docs/icons'
import { getInspiration } from '@/lib/product-config'
import { Note, Info, Tip, Warning, Check, Danger, Card, CardGroup, Columns, Tabs, Tab, Steps, Step, Accordion, AccordionGroup, Frame, Badge, Tooltip, Emoji, Icon } from '@/components/mdx/components'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ArrowUpRight, Asterisk, Lightbulb } from '@/components/icons/font-awesome'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getDocument, getPageList, getProducts } from '@/lib/content'
import { headingId, pageHref } from '@/lib/product-config'
import { DocsShell } from '@/components/docs/shell'
import { CopyPage, TableOfContents } from '@/components/docs/article-controls'
import { GettingStartedCards, Principles, ProductCards, WelcomeBanner } from '@/components/docs/content-blocks'

export async function Document({ productSlug, segments }: { productSlug: string; segments: string[] }) {
  const [products, document] = await Promise.all([getProducts(), getDocument(productSlug, segments)])
  const activeProduct = products.find(product => product.slug === productSlug)
  if (!activeProduct || !document) notFound()
  const inspiration = getInspiration(activeProduct.config)
  const pages = await getPageList(productSlug)
  const slug = segments.join('/')
  const groups = activeProduct.config.navigation
  const orderedPages = activeProduct.config.navigationTree ? flattenNavigation(activeProduct.config.navigationTree, true).filter(node => node.type === 'page' && node.slug).map(node => ({ slug: node.slug!, title: node.title })) : groups.flatMap(group => group.pages)
  const currentIndex = orderedPages.findIndex(page => page.slug === slug)
  const previous = orderedPages[currentIndex - 1]
  const next = orderedPages[currentIndex + 1]
  const section = groups.find(group => group.pages.some(page => page.slug === slug))?.group ?? 'Documentation'
  const gettingStartedPage = pages.some(page => page.slug === 'getting-started') ? 'getting-started' : undefined
  return <DocsShell products={products} activeProduct={activeProduct} pages={pages}>
    <div className="flex min-w-0 justify-center gap-10 px-5 py-9 md:px-10 md:py-11 xl:gap-12 xl:px-12 2xl:gap-16 2xl:px-16">
      <main id="main-content" className="page-enter w-full min-w-0 max-w-[760px]" key={`${productSlug}/${slug}`}>
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-primary">{section}</p><CopyPage source={document.source} /></div>
        <div className="flex flex-col gap-3 pb-7 pt-4"><h1 className="text-balance text-[32px] font-semibold leading-tight tracking-[-1.2px] sm:text-[36px]">{document.title}</h1><p className="text-pretty text-base leading-relaxed text-muted-foreground">{document.description}</p></div>
        <article className="doc-prose">
          <MDXRemote source={document.source} options={{ mdxOptions: { remarkPlugins: [literalAttributes, headingAnchors] } }} components={{
            Note, Info, Tip, Warning, Check, Danger, Card, CardGroup, Columns, Tabs, Tab, Steps, Step, Accordion, AccordionGroup, Frame, Badge, Tooltip, Emoji, Icon,
            WelcomeBanner,
            GettingStartedCards: () => <GettingStartedCards productSlug={productSlug} />,
            ProductCards: () => <ProductCards products={[activeProduct]} />,
            Principles,
            h1: (props) => <Heading {...props} level={1} />,
h2: (props) => <Heading {...props} level={2} />,
h3: (props) => <Heading {...props} level={3} />,
h4: (props) => <Heading {...props} level={4} />,
h5: (props) => <Heading {...props} level={5} />,
h6: (props) => <Heading {...props} level={6} />,
          }} />
        </article>
        <div className="flex items-center justify-between border-t pt-6 mt-10"><p className="text-sm text-muted-foreground">A little clarity goes a long way.</p><a href="#main-content" className="text-sm text-muted-foreground transition-colors hover:text-primary">Back to top ↑</a></div>
        <div className="flex gap-4 pt-7">
          {previous && <Link href={pageHref(productSlug, previous.slug)} className="group flex flex-1 items-center gap-4 rounded-xl border p-5 transition-colors hover:border-primary/40"><ArrowLeft className="size-4 text-muted-foreground" /><span className="flex flex-col gap-1"><span className="text-sm text-muted-foreground">Previous</span><span className="text-sm font-medium">{previous.title}</span></span></Link>}
          {next && <Link href={pageHref(productSlug, next.slug)} className="group ml-auto flex flex-1 items-center justify-end gap-4 rounded-xl border p-5 transition-colors hover:border-primary/40"><span className="flex flex-col gap-1 text-right"><span className="text-sm text-muted-foreground">Up next</span><span className="text-sm font-medium">{next.title}</span></span><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>}
        </div>
        <footer className="flex items-center justify-between py-10 text-sm text-muted-foreground"><span className="flex items-center gap-1">Made with <Asterisk className="size-4 text-primary" /><span className="font-medium text-foreground">spark</span></span><span>Ideas deserve a home.</span></footer>
      </main>
      <aside className="hidden w-44 shrink-0 xl:block"><div className="sticky top-40 flex flex-col gap-9"><TableOfContents headings={document.headings} />{inspiration.enabled && <div className="flex flex-col gap-3 border-t pt-6"><ProductIcon name={inspiration.icon} className="size-5 text-primary" /><p className="text-sm font-medium">{inspiration.title}</p><p className="whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">{inspiration.description}</p></div>}</div></aside>
    </div>
  </DocsShell>
}

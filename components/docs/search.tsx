'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { searchPages, highlightParts, type SearchPage } from '@/lib/search'
import Link from 'next/link'
import { ArrowUpRight, Command, FileText, Search } from '@/components/icons/font-awesome'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { pageHref, type PageInfo } from '@/lib/product-config'

export function DocSearch({ pages, theme }: { pages: PageInfo[]; theme: CSSProperties }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchPage[] | null>(null)
  const [products, setProducts] = useState<{slug:string;name:string}[]>([])
  const [product, setProduct] = useState(pages[0]?.product ?? '')
  const [status, setStatus] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!open || index) return
    const controller = new AbortController()
    setStatus('Loading documentation…')
    fetch('/api/search', {signal:controller.signal}).then(response => { if (!response.ok) throw new Error('Search unavailable'); return response.json() }).then(data => { setIndex(data.pages); setProducts(data.products); setStatus('') }).catch(error => { if (error.name !== 'AbortError') setStatus('Could not load search. Please try again.') })
    return () => controller.abort()
  }, [open, index, retry])
  const highlight = (text: string) => highlightParts(text, query).map((part, i) => part.match ? <mark key={i} className="docs-search-highlight">{part.text}</mark> : part.text)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') { event.preventDefault(); setOpen(value => !value) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const matches = searchPages(index ?? [], query, product)
  return <>
    <button onClick={() => setOpen(true)} className="flex h-10 w-full items-center justify-between rounded-lg border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground" aria-label="Search documentation">
      <span className="flex items-center gap-2.5"><Search className="size-4" /><span className="hidden sm:inline">Search documentation...</span></span>
      <kbd className="hidden items-center gap-1 rounded border px-1.5 py-0.5 font-sans text-sm sm:flex"><Command className="size-3" />K</kbd>
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl" style={theme}>
        <DialogHeader><DialogTitle>Find your next idea</DialogTitle><DialogDescription>Search page titles and content across your documentation.</DialogDescription></DialogHeader>
        <label className="flex items-center gap-3 rounded-lg border bg-background px-3"><Search className="size-4 text-muted-foreground" /><input autoFocus aria-label="Search pages" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try themes, characters, or quickstart…" className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none" /></label>
        <label className="docs-search-filter">Product<select value={product} onChange={event => setProduct(event.target.value)}><option value="">All products</option>{(products.length ? products : [{slug: pages[0]?.product ?? '', name: pages[0]?.product ?? 'Current product'}]).map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select></label>{status && <p role="status">{status}{status.startsWith('Could not') && <button type="button" onClick={() => setRetry(n => n + 1)}>Retry</button>}</p>}<div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {matches.length ? matches.map(page => <Link key={`${page.product}/${page.slug}`} href={pageHref(page.product, page.slug)} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent focus-visible:bg-accent"><FileText className="size-4 shrink-0 text-primary" /><div className="flex min-w-0 flex-1 flex-col gap-1"><span className="text-sm font-medium">{highlight(page.title)}</span><span className="text-xs text-muted-foreground">{page.productName} · /{page.slug}</span><span className="text-sm leading-6 text-muted-foreground">{highlight(page.excerpt)}</span></div><ArrowUpRight className="size-4 text-muted-foreground" /></Link>) : !status && <p className="py-10 text-center text-sm text-muted-foreground">No pages found. Try a different phrase.</p>}
        </div>
        <p className="border-t pt-3 text-sm text-muted-foreground">Navigate with Tab · Open with Enter · Close with Esc</p>
      </DialogContent>
    </Dialog>
  </>
}

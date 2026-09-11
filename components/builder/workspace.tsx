'use client'

import { capturePosition, restorePosition } from '@/lib/editor-position'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, BookOpen, Check, ChevronRight, Code2, Copy, Download, Eye, FileText, Folder, LayoutTemplate, Menu, MoreHorizontal, Pencil, Plus, Redo2, Save, Search, Settings2, Sparkles, Trash2, Undo2, X } from '@/components/icons/font-awesome'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { componentCatalog, moveBlock, parseMdx, replaceBlock, type SourceBlock } from '@/lib/mdx-editor'
import type { Product, ProductConfig } from '@/lib/product-config'
import { MdxPreview } from './mdx-preview'
import './studio.css'
import { StyledSelect } from '@/components/ui/select'
import { SourceEditor } from './source-editor'
import { ProductForm } from './product-form'
import { VisualCanvas } from './visual-canvas'
import { ComponentMenu } from './component-menu'
import { serializeDocument, parseDocument, documentSource } from '@/lib/raw-mdx'
import { tidyBlockSpacing, insertBlock } from '@/lib/mdx-editor'
import { NavigationEditor } from './navigation-editor'
import { renameNavigationPage, type NavigationNode } from '@/lib/navigation'

type Page = { slug: string; title: string; description: string; source: string; draft: boolean; fileName?: string; revision?: string; isNew?: boolean; frontmatter?: Record<string, unknown>; rawSource?: string; navigationParent?: string | null }
const snapshot = (page: Page | null) => JSON.stringify(page)
const initialConfig = (): ProductConfig => ({ name: 'New product', description: '', motto: '', version: 'v1.0', icon: 'book', theme: { accent: '#f0ac73', font: 'Inter', branding: 'spark' }, navigation: [] })
async function api(url: string, body?: unknown, method = 'POST') {
  const response = await fetch(url, body === undefined ? undefined : { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const text = await response.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (response.status === 405) throw new Error('This server does not support this action yet. Copy the updated app/api/builder folder and restart the development server.')
  if (!data) throw new Error(`The server returned an unexpected response (HTTP ${response.status}). Check the development server terminal.`)
  if (!response.ok) throw new Error(data.error ?? 'Request failed')
  return data
}
export function BuilderWorkspace({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [selected, setSelected] = useState(initialProducts[0]?.slug ?? '')
  const [pages, setPages] = useState<Page[]>([])
  const [page, setPage] = useState<Page | null>(null)
  const [original, setOriginal] = useState<Page | null>(null)
  const [saved, setSaved] = useState('null')
  const [mode, setMode] = useState<'visual' | 'source' | 'preview'>('visual')
  const [status, setStatus] = useState('Loading workspace…')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [settings, setSettings] = useState(false)
  const [productSettings, setProductSettings] = useState(false)
  const [productDraft, setProductDraft] = useState<ProductConfig>(initialConfig)
  const [newProductSlug, setNewProductSlug] = useState('')
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [rawText, setRawText] = useState('')
  const [rawError, setRawError] = useState('')
  const [rawDirty, setRawDirty] = useState(false)
  const [past, setPast] = useState<Page[]>([])
  const [future, setFuture] = useState<Page[]>([])
  const [recovery, setRecovery] = useState<Page | null>(null)
  const loadId = useRef(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const switchFrame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(switchFrame.current), [])
  const sourceRef = useRef<HTMLTextAreaElement>(null)
  const product = products.find(p => p.slug === selected)
  const dirty = snapshot(page) !== saved || rawDirty
  const parsed = useMemo(() => parseMdx(page?.source ?? ''), [page?.source])
  const draftKey = original ? `spark:local-draft:${selected}:${original.slug}` : ''
  function openPage(next: Page, productSlug = selected) {
    setRawText(next.rawSource ?? serializeDocument(next)); setRawDirty(false); setPage(next); setOriginal(next); setSaved(snapshot(next)); setPast([]); setFuture([]); setRawError(''); setRecovery(null); setMobileNav(false)
    try { const cached = localStorage.getItem(`spark:local-draft:${productSlug}:${next.slug}`); if (cached) { const draft = JSON.parse(cached); if (draft.slug === next.slug && typeof draft.source === 'string' && typeof draft.title === 'string' && typeof draft.description === 'string' && typeof draft.draft === 'boolean' && snapshot(draft) !== snapshot(next)) setRecovery(draft) } } catch { /* Storage is optional. */ }
  }
  function leave() { return !dirty || window.confirm('You have unsaved changes. Leave this page? A local recovery copy may be available in this browser.') }
  async function loadProduct(slug: string) {
    const id = ++loadId.current
    setBusy(true); setError(''); setStatus('Loading pages…')
    try { const data = await api(`/api/builder/pages?product=${encodeURIComponent(slug)}`); if (id !== loadId.current) return; setSelected(slug); setPages(data.pages); setPage(null); setOriginal(null); setSaved('null'); setRecovery(null); setPast([]); setFuture([]); setStatus('Ready to write'); if (data.pages.length) openPage(data.pages.find((p: Page) => p.slug === 'index') ?? data.pages[0], slug) }
    catch (e) { if (id === loadId.current) setError((e as Error).message) }
    finally { if (id === loadId.current) setBusy(false) }
  }
  useEffect(() => { if (initialProducts[0]) void loadProduct(initialProducts[0].slug); else setStatus('Create your first product') }, [])
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
  useEffect(() => {
    if (!page || !draftKey || !dirty) return
    const timer = setTimeout(() => { try { localStorage.setItem(draftKey, snapshot(page)); setStatus('Recovery copy saved in this browser') } catch { setStatus('Local recovery unavailable — save your page') } }, 700)
    return () => clearTimeout(timer)
  }, [page, draftKey, dirty])
  function change(update: Partial<Page>) {
    if (!page || busy) return
    setPast(p => [...p.slice(-99), page]); setFuture([]); setPage({ ...page, ...update }); setStatus('Unsaved changes')
  }
  function undo() { if (!page || !past.length || busy) return; setFuture(f => [page, ...f]); setPage(past[past.length - 1]); setRawText(serializeDocument(past[past.length - 1])); setRawDirty(false); setPast(p => p.slice(0, -1)); setRawError('') }
  function redo() { if (!page || !future.length || busy) return; setPast(p => [...p, page]); setPage(future[0]); setRawText(serializeDocument(future[0])); setRawDirty(false); setFuture(f => f.slice(1)); setRawError('') }
  async function save() {
    if (rawError) { setError(rawError); return }
    if (!page || busy || parsed.error) return
    const next = page
    setBusy(true); setError(''); setStatus('Saving page…')
    try {
      const result = await api('/api/builder/pages', { ...next, fileName: `${next.slug}.mdx`, product: selected, originalSlug: original?.slug, originalFileName: original?.fileName, expectedRevision: original?.revision, create: !!original?.isNew })
      const stored = { ...next, rawSource: result.rawSource, fileName: result.fileName, revision: result.revision, isNew: false }
      setPages(current => original?.isNew ? [...current, stored] : current.map(item => item.slug === original?.slug ? stored : item))
      setProducts(current => current.map(item => item.slug !== selected ? item : { ...item, config: { ...item.config, navigation: item.config.navigation.map(group => ({ ...group, pages: group.pages.map(p => p.slug === original?.slug ? { ...p, slug: stored.slug, title: stored.title } : p) })) } }));
      setRawDirty(false); setRawText(result.rawSource ?? serializeDocument(stored)); setPage(stored); setOriginal(stored); setSaved(snapshot(stored)); setRecovery(null); setStatus('Saved to project'); try { const refreshed = await api(`/api/builder/pages?product=${encodeURIComponent(selected)}`); setProducts(items => items.map(item => item.slug === selected ? { ...item, config: refreshed.config } : item)) } catch { setStatus('Page saved. Reload the product to refresh navigation.') }
      try { localStorage.removeItem(draftKey) } catch { /* optional */ }
    } catch (e) { setError((e as Error).message); setStatus('Not saved') } finally { setBusy(false) }
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.key.toLowerCase() === 's') { event.preventDefault(); if (event.shiftKey) { switchMode(mode === 'source' ? 'visual' : 'source') } else void save() }
    }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  })
  function switchMode(nextMode: typeof mode) {
    if (nextMode === mode || !page) return
    if (rawError && nextMode !== 'source') { setError('Fix the frontmatter before switching modes.'); return }
    const inset = () => (headerRef.current?.offsetHeight ?? 65) + (toolbarRef.current?.offsetHeight ?? 60) + 16
    const position = capturePosition(contentRef.current, mode === 'source' ? sourceRef.current : null, rawText, page.source, inset())
    const nextRaw = nextMode === 'source' ? documentSource(page) : rawText
    if (nextMode === 'source') setRawText(nextRaw)
    cancelAnimationFrame(switchFrame.current)
    setMode(nextMode)
    switchFrame.current = requestAnimationFrame(() => { switchFrame.current = requestAnimationFrame(() => restorePosition(position, contentRef.current, nextMode === 'source' ? sourceRef.current : null, nextRaw, page.source, inset())) })
  }
  function editRaw(raw: string) {
    setRawText(raw); setRawDirty(true)
    try { const parsed = parseDocument(raw); setRawError(''); change({ ...parsed, rawSource: raw }) } catch (e) { change({ rawSource: raw }); setRawError((e as Error).message) }
  }
  function add(source: string) {
    if (!page) return
    change({ source: insertBlock(page.source, source, parsed.blocks.length) })
  }
  function newPage(parent: string | null = null) {
    if (!leave() || !selected) return
    let n = 1; while (pages.some(p => p.slug === `untitled-${n}`)) n++
    openPage({ slug: `untitled-${n}`, title: 'Untitled page', description: '', source: '', draft: true, isNew: true, navigationParent: parent }); setSaved('null'); setStatus('New page — not saved yet')
  }
  function exportPage() {
    if (!page) return
    const text = mode === 'source' ? rawText : documentSource(page)
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' })); const a = document.createElement('a'); a.href = url; a.download = `${page.slug.replaceAll('/', '-')}.mdx`; a.click(); URL.revokeObjectURL(url)
  }
  async function removeProduct(confirmation: string) {
    if (busy || !product || creatingProduct) return
    const slug = selected
    setBusy(true); setError('')
    try {
      await api('/api/builder/products', { slug, confirmation }, 'DELETE')
      ++loadId.current
      cancelAnimationFrame(switchFrame.current)
      const remaining = products.filter(item => item.slug !== slug)
      setProducts(remaining); setProductSettings(false); setSelected(''); setPages([])
      setPage(null); setOriginal(null); setSaved('null'); setRecovery(null)
      setPast([]); setFuture([]); setRawText(''); setRawDirty(false); setRawError('')
      try {
        const prefix = `spark:local-draft:${slug}:`
        for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key)
      } catch { /* Storage is optional. */ }
      if (remaining[0]) await loadProduct(remaining[0].slug)
      else setStatus('Product deleted. Create a product to get started.')
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  async function saveConfig() {
    setBusy(true); setError('')
    try { const result = await api('/api/builder/products', { originalSlug: creatingProduct ? undefined : selected, slug: creatingProduct ? newProductSlug : selected, config: productDraft, create: creatingProduct }); setProducts(p => p.some(item => item.slug === result.slug) ? p.map(item => item.slug === result.slug ? result : item) : [...p, result]); setProductSettings(false); if (creatingProduct) await loadProduct(result.slug); setStatus('Product saved') } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function saveTree(tree: NavigationNode[]) {
    if (!product || busy) return false
    setBusy(true); setError('')
    try { const result = await api('/api/builder/navigation', { product: selected, tree, expectedTree: product.config.navigationTree }); setProducts(items => items.map(item => item.slug === selected ? { ...item, config: { ...item.config, navigationTree: result.tree } } : item)); setStatus('Navigation saved'); return true } catch (e) { setError((e as Error).message); return false } finally { setBusy(false) }
  }
  return <main className="studio">
    <aside className={`studio-sidebar ${mobileNav ? 'is-open' : ''}`}>
      <div className="studio-brand"><span className="studio-mark"><Sparkles size={19} /></span><strong>spark<span>studio</span></strong><button className="studio-icon mobile-only" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
      <label className="studio-product-label">WORKSPACE<StyledSelect label="Product" studio value={selected} disabled={busy} onValueChange={value => { if (leave()) void loadProduct(value) }} options={products.map(p => ({ value: p.slug, label: p.config.name }))} /></label>
      {product && <NavigationEditor key={selected} config={product.config} pages={pages} activeSlug={original?.slug} busy={busy} onChange={saveTree} onOpen={slug => { const next = pages.find(p => p.slug === slug); if (next && leave()) openPage(next) }} onNewPage={parent => newPage(parent)} onNewProduct={() => { if (!leave()) return; setProductDraft({ ...initialConfig(), name: '' }); setNewProductSlug(''); setCreatingProduct(true); setProductSettings(true) }} />}
      <div className="studio-sidebar-footer"><button disabled={!selected || busy} onClick={() => { setProductDraft(product?.config ?? initialConfig()); setError(''); setNewProductSlug(''); setCreatingProduct(false); setProductSettings(true) }}><Settings2 size={16} /> Product settings</button><button disabled={busy} onClick={() => { if (!leave()) return; setProductDraft({ ...initialConfig(), name: '' }); setError(''); setNewProductSlug(''); setCreatingProduct(true); setProductSettings(true) }}><Plus size={16} /> Add product</button><button className="studio-new" disabled={!selected || busy} onClick={() => newPage()}><Plus size={17} /> New page</button><a href={selected ? `/docs/${selected}` : '/'}><BookOpen size={14} /> Open documentation <ChevronRight size={13} /></a></div>
    </aside>
    <section className="studio-main">
      <header ref={headerRef} className="studio-header"><button className="studio-icon mobile-only" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={18} /></button><div className="studio-breadcrumb"><span>{product?.config.name ?? 'Workspace'}</span><ChevronRight size={13} /><strong>{page?.title || 'Documentation'}</strong></div><div className="studio-actions"><span className="studio-save-state" role="status"><i className={dirty ? 'unsaved' : ''} />{busy ? 'Working…' : dirty ? 'Unsaved' : 'Saved'}</span>{page && <><button className="studio-icon" aria-label="Export MDX" title="Export MDX" onClick={exportPage}><Download size={17} /></button><button className="studio-save" disabled={busy || !!rawError || !!parsed.error || (!dirty && !page.isNew)} onClick={() => void save()}><Save size={15} /> Save page</button><button className="studio-icon" aria-label="Page settings" onClick={() => setSettings(true)}><MoreHorizontal size={20} /></button></>}</div></header>
      {error && <div className="studio-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={16} /></button></div>}
      {page ? <>
        <div ref={toolbarRef} className="studio-toolbar"><div className="studio-modes" aria-label="Editor mode">{([['visual', Pencil, 'Visual'], ['source', Code2, 'Source'], ['preview', Eye, 'Preview']] as const).map(([value, Icon, label]) => <button key={value} aria-pressed={mode === value} onClick={() => switchMode(value)}><Icon size={14} />{label}</button>)}</div><div className="studio-tools"><button className="studio-icon" disabled={!past.length || busy} aria-label="Undo" onClick={undo}><Undo2 size={16} /></button><button className="studio-icon" disabled={!future.length || busy} aria-label="Redo" onClick={redo}><Redo2 size={16} /></button><span /><ComponentMenu disabled={busy || mode !== 'visual'} label="Insert component" onInsert={add} /></div></div>
        {recovery && <div className="studio-recovery">A local recovery copy is available.<button onClick={() => { change({ ...recovery, revision: original?.revision }); setRawText(recovery.rawSource ?? serializeDocument(recovery)); setMode('source'); setRawDirty(true); try { parseDocument(recovery.rawSource ?? serializeDocument(recovery)); setRawError('') } catch (e) { setRawError((e as Error).message) } setRecovery(null) }}>Restore copy</button><button onClick={() => { setRecovery(null); try { localStorage.removeItem(draftKey) } catch {} }}>Dismiss</button></div>}
        <div ref={contentRef} className={`studio-content ${mode === 'source' ? 'studio-raw-content' : ''}`}>
          {mode === 'source' ? <div className="studio-raw-editor"><div className="studio-source-label"><Code2 size={14} />{page.slug}.mdx<span>Raw MDX</span><button onClick={() => { try { const doc = parseDocument(rawText); editRaw(serializeDocument({ ...doc, source: tidyBlockSpacing(doc.source) })) } catch (e) { setRawError((e as Error).message) } }}>Tidy block spacing</button></div><SourceEditor inputRef={sourceRef} value={rawText} disabled={busy} onChange={editRaw} />{(rawError || parsed.error) && <p role="alert" className="studio-error">{rawError || parsed.error}</p>}</div> : <article className="studio-paper">
            <div className="studio-page-kicker"><FileText size={22} /><span>{page.draft ? 'DRAFT PAGE' : 'DOCUMENTATION'}</span></div>
            <input className="studio-title" aria-label="Page title" placeholder="Untitled page" value={page.title} readOnly={mode === 'preview' || busy} onChange={e => change({ title: e.target.value })} />
            <textarea className="studio-description" aria-label="Page description" placeholder="Add a description to set the scene…" value={page.description} readOnly={mode === 'preview' || busy} onChange={e => change({ description: e.target.value })} rows={2} />
            {mode === 'preview' ? <div className="studio-preview-blocks">{parsed.blocks.map(block => <div key={block.start} data-editor-offset={block.start}><MdxPreview source={page.source} nodes={[block.node]} product={product} /></div>)}</div> : <VisualCanvas pages={pages} key={`${selected}:${original?.slug}`} source={page.source} product={product} disabled={busy} onChange={source => change({ source })} />}
          </article>}
        </div><footer className="studio-status"><span>{status}</span><span>{page.source.trim() ? page.source.trim().split(/\s+/).length : 0} words <b>·</b> {page.slug}.mdx <b>·</b> Ctrl / ⌘ S to save</span></footer>
      </> : <div className="studio-empty"><span className="studio-mark"><Sparkles size={28} /></span><p className="studio-eyebrow">A HOME FOR YOUR IDEAS</p><h1>Something great<br />starts with a page.</h1><p>Choose a page from the sidebar, or give<br />your next idea a place to grow.</p><button className="studio-save" disabled={!selected || busy} onClick={() => newPage()}><Plus size={16} /> Create a page</button><div className="studio-empty-cards">{['Write naturally', 'Compose with components', 'Keep your MDX'].map((title, i) => <div key={title}>{i === 0 ? <Pencil /> : i === 1 ? <LayoutTemplate /> : <Code2 />}<strong>{title}</strong><p>{['A focused canvas for your documentation.', 'Callouts, cards, tabs, steps, and more.', 'Switch to source whenever you need.'][i]}</p></div>)}</div></div>}
    </section>
    <Dialog open={settings} onOpenChange={setSettings}><DialogContent className="studio-dialog"><DialogTitle>Page settings</DialogTitle><DialogDescription>The file path also determines this page’s URL.</DialogDescription>{page && <><label>Page path<input value={page.slug} disabled={busy} onChange={e => change({ slug: e.target.value })} /><small>content/{selected}/{page.slug}.mdx</small></label><label className="studio-checkbox"><input type="checkbox" checked={page.draft} disabled={busy} onChange={e => change({ draft: e.target.checked })} />Draft metadata</label><p className="studio-muted">Draft is a metadata label. This project currently includes draft pages in documentation.</p><button className="studio-save" onClick={() => setSettings(false)}><Check size={15} /> Done</button></>}</DialogContent></Dialog>
    <Dialog open={productSettings} onOpenChange={open => { if (!busy) setProductSettings(open) }}><DialogContent className="studio-dialog sm:max-w-lg"><DialogTitle>{creatingProduct ? 'Create a product' : 'Product settings'}</DialogTitle><DialogDescription>{creatingProduct ? 'Give your next idea a home. You can add pages once it’s created.' : 'Update your product’s details and appearance.'}</DialogDescription>{error && <p role="alert" className="studio-error">{error}</p>}<ProductForm key={`${creatingProduct}:${selected}:${productSettings}`} config={productDraft} onChange={setProductDraft} creating={creatingProduct} slug={creatingProduct ? newProductSlug : selected} onSlugChange={setNewProductSlug} busy={busy} onSave={() => void saveConfig()} deleteError={error} onDelete={confirmation => void removeProduct(confirmation)} /></DialogContent></Dialog>
  </main>
}

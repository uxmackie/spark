'use client'
import { inlineHtml } from '@/lib/rich-text'
import { parseMdx } from '@/lib/mdx-editor'
import { InlineTools } from './inline-tools'
import { safeUrl } from '@/components/mdx/components'
import { pageHref } from '@/lib/product-config'
import { useEffect, useRef, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function SelectionToolbar({ pages = [], productSlug = "" }: { pages?: { title: string; slug: string }[]; productSlug?: string }) {
  const [position, setPosition] = useState<{ left: number; top: number; style: boolean } | null>(null)
  const selection = useRef<Range | null>(null)
  const editor = useRef<HTMLElement | null>(null)
  const toolbar = useRef<HTMLDivElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [inlineOpen, setInlineOpen] = useState(false)
  const [href, setHref] = useState('')
  useEffect(() => {
    const update = () => {
      if (linkOpen || inlineOpen || toolbar.current?.contains(document.activeElement)) return
      const selected = window.getSelection()
      if (!selected?.rangeCount) { setPosition(null); return }
      const range = selected.getRangeAt(0)
      const start = (range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement) as HTMLElement
      const root = start?.closest<HTMLElement>('[data-rich-editor]')
      if (!root || !root.contains(range.endContainer)) { setPosition(null); return }
      selection.current = range.cloneRange(); editor.current = root
      const rect = range.getBoundingClientRect()
      setPosition({ left: Math.max(8, Math.min(window.innerWidth - 325, rect.left)), top: Math.max(8, rect.top - 48), style: root.dataset.canStyle === 'true' })
    }
    document.addEventListener('selectionchange', update)
    window.addEventListener('scroll', update, true)
    return () => { document.removeEventListener('selectionchange', update); window.removeEventListener('scroll', update, true) }
  }, [linkOpen, inlineOpen])
  function restore() { const range = selection.current; if (!range || !editor.current?.isConnected) return false; editor.current.focus(); const selected = window.getSelection(); selected?.removeAllRanges(); selected?.addRange(range); return true }
  function command(name: string, value?: string) { if (!restore()) return; document.execCommand(name, false, value); editor.current?.dispatchEvent(new Event('input', { bubbles: true })); setPosition(null) }
  function code() { if (!restore()) return; const range = window.getSelection()!.getRangeAt(0); const element = document.createElement('code'); element.appendChild(range.extractContents()); range.insertNode(element); editor.current?.dispatchEvent(new Event('input', { bubbles: true })); setPosition(null) }
  return <><div ref={toolbar} className="studio-selection-toolbar" role="toolbar" aria-label="Text formatting" style={position ? { position: 'fixed', left: position.left, top: position.top } : { display: 'none' }} onMouseDown={event => event.preventDefault()}>
    {position?.style && <DropdownMenu><DropdownMenuTrigger className="studio-format-type">Text ▾</DropdownMenuTrigger><DropdownMenuContent className="studio-context-menu">{[['paragraph', 'Text'], ['h1', 'Heading 1'], ['h2', 'Heading 2'], ['h3', 'Heading 3'], ['ul', 'Bullet list'], ['ol', 'Ordered list']].map(([value, label]) => <DropdownMenuItem key={value} onClick={() => { editor.current?.dispatchEvent(new CustomEvent('spark-block-style', { detail: value })); setPosition(null) }}>{label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>}
    <button title="Bold" aria-label="Bold" onClick={() => command('bold')}><b>B</b></button><button title="Italic" aria-label="Italic" onClick={() => command('italic')}><i>I</i></button><button title="Underline" aria-label="Underline" onClick={() => command('underline')}><u>U</u></button><button title="Strikethrough" aria-label="Strikethrough" onClick={() => command('strikeThrough')}><s>S</s></button><button title="Inline code" aria-label="Inline code" onClick={code}>&lt;/&gt;</button><button title="Link" aria-label="Add link" onClick={() => { setHref(''); setLabel(selection.current?.toString() ?? ''); setLinkOpen(true) }}>↗</button><button title="Insert tooltip or icon" aria-label="Insert tooltip or icon" onClick={() => setInlineOpen(true)}>＋</button><button title="Clear formatting" aria-label="Clear formatting" onClick={() => command('removeFormat')}>T×</button>
  </div><Dialog open={linkOpen} onOpenChange={setLinkOpen}><DialogContent className="studio-dialog"><DialogTitle>Add a link</DialogTitle><DialogDescription>Search a page or enter a URL. Page links use a path without your domain.</DialogDescription><form className="studio-tooltip-form" onSubmit={event => { event.preventDefault(); if (!safeUrl(href) || !restore()) return; const range = window.getSelection()!.getRangeAt(0); const anchor = document.createElement('a'); anchor.href = href; anchor.textContent = label || href; range.deleteContents(); range.insertNode(anchor); editor.current?.dispatchEvent(new Event('input', { bubbles: true })); setLinkOpen(false); setPosition(null) }}><label>Enter URL or search pages<input aria-label="Link destination" required value={href} onChange={event => setHref(event.target.value)} /></label><div className="studio-page-link-results">{pages.filter(page => `${page.title} ${page.slug}`.toLowerCase().includes(href.toLowerCase()) || href === pageHref(productSlug, page.slug)).map(page => <button type="button" key={page.slug} onClick={() => { setHref(pageHref(productSlug, page.slug)); if (!label) setLabel(page.title) }}><strong>{page.title}</strong><small>{pageHref(productSlug, page.slug)}</small></button>)}</div><label>Link text<input value={label} onChange={event => setLabel(event.target.value)} /></label><button className="studio-save" type="submit" disabled={!safeUrl(href)}>Apply link</button></form></DialogContent></Dialog><Dialog open={inlineOpen} onOpenChange={setInlineOpen}><DialogContent className="studio-dialog"><DialogTitle>Insert inline component</DialogTitle><DialogDescription>Add a tooltip or Font Awesome icon at your selection.</DialogDescription><InlineTools selectedText={() => selection.current?.toString() ?? ''} onInsert={value => { if (!restore()) return; const range = window.getSelection()!.getRangeAt(0); const chip = document.createElement('span'); chip.contentEditable = 'false'; chip.dataset.mdxRaw = value; chip.innerHTML = inlineHtml(parseMdx(value).blocks.map(block => block.node), value); range.deleteContents(); range.insertNode(chip); range.setStartAfter(chip); range.collapse(true); editor.current?.dispatchEvent(new Event('input', { bubbles: true })); setInlineOpen(false); setPosition(null) }} /></DialogContent></Dialog></>
}

'use client'
import { safeUrl } from '@/components/mdx/components'
import { IconPicker } from './icon-picker'
import { useState } from 'react'
import { emojiNames, iconLabel } from '@/lib/icon-catalog'
import { ProductIcon } from '@/components/docs/icons'
import { tooltipMarkup, iconMdx } from '@/lib/inline-mdx'

export function InlineTools({ onInsert, selectedText }: { onInsert: (value: string) => void; selectedText: () => string }) {
  const [mode, setMode] = useState<'tooltip' | 'emoji' | 'icon' | null>(null)
  const [query, setQuery] = useState('')
  const [iconHref, setIconHref] = useState('')
  const validIconHref = !iconHref.trim() || !!safeUrl(iconHref)
  const [iconTip, setIconTip] = useState('')
  const [tip, setTip] = useState('')
  const [headline, setHeadline] = useState('')
  const [cta, setCta] = useState('')
  const [href, setHref] = useState('')
  return <div className="studio-inline-tools"><div className="studio-block-formatting"><button type="button" aria-expanded={mode === 'tooltip'} onClick={() => setMode(mode === 'tooltip' ? null : 'tooltip')}>Tooltip</button><button type="button" aria-expanded={mode === 'emoji'} onClick={() => setMode(mode === 'emoji' ? null : 'emoji')}>Emoji</button><button type="button" aria-expanded={mode === 'icon'} onClick={() => setMode(mode === 'icon' ? null : 'icon')}>Icons</button></div>{(mode === 'icon' || mode === 'emoji') && <><label className="studio-icon-tooltip-field">Tooltip (optional)<textarea rows={3} value={iconTip} onChange={event => setIconTip(event.target.value)} placeholder="Supports **bold**, links, lists, and MDX components" /></label><label className="studio-icon-tooltip-field">Link URL (optional)<input value={iconHref} onChange={event => setIconHref(event.target.value)} placeholder="https://… or /docs/product/page" aria-invalid={!validIconHref} /></label>{!validIconHref && <p role="alert">Enter a valid web URL or page path.</p>}</>}{mode === 'icon' && <IconPicker value="" onChange={icon => { if (!validIconHref) return; onInsert(iconMdx(icon, iconTip, false, iconHref)); setMode(null) }} />}{mode === 'emoji' && <div className="studio-emoji-picker" aria-label="Font Awesome icons"><input aria-label="Search icons" placeholder="Search icons…" value={query} onChange={e => setQuery(e.target.value)} />{emojiNames.filter(icon => icon.includes(query.toLowerCase().replace(/ /g, '-'))).map(icon => <button type="button" key={icon} title={iconLabel(icon)} aria-label={iconLabel(icon)} onClick={() => { if (!validIconHref) return; onInsert(iconMdx(icon, iconTip, true, iconHref)); setMode(null) }}><ProductIcon name={icon} className="size-5" /></button>)}</div>}{mode === 'tooltip' && <div className="studio-tooltip-form"><p>Wrap selected text, or insert a new tooltip.</p><label>Explanation (Markdown / MDX)<textarea rows={4} value={tip} onChange={e => setTip(e.target.value)} /></label><label>Heading (optional)<input value={headline} onChange={e => setHeadline(e.target.value)} /></label><label>Link label (optional)<input value={cta} onChange={e => setCta(e.target.value)} /></label><label>Link URL<input value={href} onChange={e => setHref(e.target.value)} placeholder="https://… or /page" /></label><button type="button" disabled={!tip.trim() || (!!cta.trim() && !href.trim())} onClick={() => { onInsert(tooltipMarkup(selectedText() || 'Hover over this text', { tip, headline, cta, href })); setMode(null) }}>Insert tooltip</button></div>}</div>
}

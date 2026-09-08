'use client'
import { useState, createElement, type ReactNode } from 'react'
import { Copy } from '@/components/icons/font-awesome'
export function Heading({ level, id, children }: { level: number; id?: string; children?: ReactNode }) {
  const [status, setStatus] = useState('')
  return createElement(`h${level}`, { id, className: 'doc-heading' }, <><a className="doc-heading-anchor" href={`#${id}`}>{children}</a><button type="button" className="doc-heading-copy" aria-label="Copy section link" title={status || 'Copy section link'} onClick={async () => { try { const url = new URL(window.location.href); url.hash = id ?? ''; await navigator.clipboard.writeText(url.href); setStatus('Copied') } catch { setStatus('Copy unavailable') } }}><Copy className="size-3" /></button><span className="sr-only" role="status">{status}</span></>)
}

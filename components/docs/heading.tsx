'use client'
import { useState, useEffect, createElement, type ReactNode } from 'react'
import { LinkIcon, Check } from '@/components/icons/font-awesome'
export function Heading({ level, id, children }: { level: number; id?: string; children?: ReactNode }) {
  const [status, setStatus] = useState('')
  useEffect(() => { if (!status) return; const timer = setTimeout(() => setStatus(''), 2500); return () => clearTimeout(timer) }, [status])
  return createElement(`h${level}`, { id, className: 'doc-heading' }, <><button type="button" className="doc-heading-copy" aria-label="Copy section link" title={status || 'Copy section link'} onClick={async () => { try { const url = new URL(window.location.href); url.hash = id ?? ''; await navigator.clipboard.writeText(url.href); setStatus('Copied') } catch { setStatus('Copy unavailable') } }}><>{status === 'Copied' ? <Check size={12} className="doc-heading-copy-icon" aria-hidden="true" /> : <LinkIcon size={12} className="doc-heading-copy-icon" aria-hidden="true" />}</></button><a className="doc-heading-anchor" href={`#${id}`}>{children}</a><span className="sr-only" role="status">{status}</span></>)
}

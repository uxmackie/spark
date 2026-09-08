'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from '@/components/icons/font-awesome'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CopyPage({ source }: { source: string }) {
  const [status, setStatus] = useState('')
  useEffect(() => { if (!status) return; const timeout = setTimeout(() => setStatus(''), 3000); return () => clearTimeout(timeout) }, [status])
  async function copy() {
    try { await navigator.clipboard.writeText(source); setStatus('Copied') } catch { setStatus('Copy unavailable') }
  }
  return <div className="flex items-center"><Button variant="ghost" onClick={copy}>{status === 'Copied' ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}<span>{status || 'Copy page'}</span></Button><span role="status" className="sr-only">{status}</span></div>
}

export function TableOfContents({ headings }: { headings: { title: string; id: string; depth: number }[] }) {
  const [active, setActive] = useState(headings[0]?.id)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { for (const entry of entries) { if (entry.isIntersecting) setActive(entry.target.id) } }, { rootMargin: '-145px 0px -50% 0px' })
    for (const heading of headings) { const element = document.getElementById(heading.id); if (element) observer.observe(element) }
    return () => observer.disconnect()
  }, [headings])
  return <nav aria-label="On this page" className="flex flex-col gap-3"><p className="text-xs font-normal leading-4">On this page</p><div className="flex flex-col gap-3">{headings.map(heading => <a key={heading.id} style={{ paddingLeft: (heading.depth - Math.min(...headings.map(h => h.depth))) * 16 }} onClick={() => setActive(heading.id)} href={`#${heading.id}`} className={cn('text-sm leading-5 transition-colors', active === heading.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>{heading.title}</a>)}</div></nav>
}

'use client'

import { useMemo, useRef, useLayoutEffect, type RefObject } from 'react'
import { highlightSource } from '@/lib/source-highlight'

export function SourceEditor({ value, onChange, disabled, inputRef }: {
  value: string; onChange: (value: string) => void; disabled: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
}) {
  const highlightRef = useRef<HTMLPreElement>(null)
  function syncScroll() {
    const input = inputRef.current, highlight = highlightRef.current
    if (input && highlight) highlight.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`
  }
  useLayoutEffect(syncScroll, [value])
  const lines = useMemo(() => {
    const result: { start: number; end: number; tokens: { text: string; kind: string }[] }[] = [{ start: 0, end: 0, tokens: [] }]
    for (const token of highlightSource(value)) {
      token.text.split('\n').forEach((text, index) => {
        if (index) { const start = result[result.length - 1].end + 1; result.push({ start, end: start, tokens: [] }) }
        const line = result[result.length - 1]
        if (text) line.tokens.push({ text, kind: token.kind })
        line.end += text.length
      })
    }
    return result
  }, [value])
  return <div className="studio-code-surface">
    <pre ref={highlightRef} className="studio-code-highlight" aria-hidden="true">{lines.map((line, index) => <span className="studio-code-line" key={line.start} data-source-start={line.start} data-source-end={line.end}>{line.tokens.map((token, i) => <span key={i} className={token.kind ? `source-${token.kind}` : undefined}>{token.text}</span>)}{index < lines.length - 1 ? '\n' : '\u200b'}</span>)}</pre>
    <textarea ref={inputRef} className="studio-code-input" aria-label="Raw MDX source" spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="soft" onScroll={syncScroll} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} />
  </div>
}

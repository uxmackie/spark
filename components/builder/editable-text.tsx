'use client'
import { createElement, useLayoutEffect, useRef } from 'react'
import { domToMarkdown } from '@/lib/rich-text'

// React owns the element; the browser exclusively owns its editable children.
export function EditableText({ html, label, onChange, onStyle, tag = 'div', plain = false, multiline = true }: { html: string; label: string; onChange: (value: string) => void; onStyle?: (style: string) => void; tag?: string; plain?: boolean; multiline?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const composing = useRef(false)
  const last = useRef<string | null>(null)
  const latest = useRef({ onChange, onStyle }); latest.current = { onChange, onStyle }
  useLayoutEffect(() => { const el = ref.current; if (el && !el.contains(document.activeElement) && el.innerHTML !== html) { el.innerHTML = html; last.current = null } }, [html])
  useLayoutEffect(() => {
    const element = ref.current!
    const style = (event: Event) => latest.current.onStyle?.((event as CustomEvent).detail)
    element.addEventListener('spark-block-style', style)
    return () => element.removeEventListener('spark-block-style', style)
  }, [])
  function commit() {
    if (!ref.current || composing.current) return
    const value = plain ? ref.current.innerText : domToMarkdown(ref.current)
    if (last.current === value) return
    last.current = value
    latest.current.onChange(value)
  }
  function insertText(text: string) {
    const selected = window.getSelection()
    if (!selected?.rangeCount || !ref.current) return
    const range = selected.getRangeAt(0)
    if (!ref.current.contains(range.startContainer) || !ref.current.contains(range.endContainer)) return
    range.deleteContents()
    const fragment = document.createDocumentFragment()
    const lines = (multiline ? text : text.replace(/[\r\n]+/g, ' ')).replace(/\r\n?/g, '\n').split('\n')
    lines.forEach((line, index) => { if (index) fragment.append(document.createElement('br')); fragment.append(document.createTextNode(line)) })
    const end = fragment.lastChild!
    range.insertNode(fragment); range.setStartAfter(end); range.collapse(true)
    selected.removeAllRanges(); selected.addRange(range)
    commit()
  }
  return createElement(tag, {
    ref, contentEditable: true, suppressContentEditableWarning: true, role: 'textbox', 'aria-label': label, 'aria-multiline': multiline,
    'data-rich-editor': plain ? undefined : 'true', 'data-can-style': onStyle ? 'true' : undefined, className: `studio-editable ${plain ? 'is-plain' : ''}`,
    onInput: (event: React.FormEvent) => { event.stopPropagation(); commit() }, onBlur: commit,
    onCompositionStart: () => { composing.current = true }, onCompositionEnd: () => { composing.current = false; commit() },
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); if (multiline) insertText('\n'); else ref.current?.blur() } },
    onPaste: (event: React.ClipboardEvent) => { event.preventDefault(); event.stopPropagation(); insertText(event.clipboardData.getData('text/plain')) },
    onDrop: (event: React.DragEvent) => { if (!event.dataTransfer.types.includes('application/spark-block')) { event.preventDefault(); event.stopPropagation() } },
  })
}

'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'
import { Compartment, EditorState, StateField, Transaction } from '@codemirror/state'
import { Decoration, EditorView, keymap, type DecorationSet } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { highlightSource } from '@/lib/source-highlight'

export type SourceEditorHandle = {
  capture: (inset: number) => { offset: number; top: boolean }
  restore: (offset: number, inset: number, top: boolean) => void
}
function marks(state: EditorState): DecorationSet {
  let offset = 0
  const ranges = []
  for (const token of highlightSource(state.doc.toString())) {
    const end = offset + token.text.length
    if (token.kind && end > offset) ranges.push(Decoration.mark({ class: `source-${token.kind}` }).range(offset, end))
    offset = end
  }
  return Decoration.set(ranges)
}
const syntax = StateField.define<DecorationSet>({
  create: marks,
  update: (value, transaction) => transaction.docChanged ? marks(transaction.state) : value,
  provide: field => EditorView.decorations.from(field),
})
export function SourceEditor({ value, onChange, disabled, inputRef }: {
  value: string; onChange: (value: string) => void; disabled: boolean
  inputRef: RefObject<SourceEditorHandle | null>
}) {
  const host = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const latest = useRef(onChange); latest.current = onChange
  const external = useRef(false)
  const editable = useRef(new Compartment())
  useLayoutEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({ doc: value, extensions: [
        syntax, history(), keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ 'aria-label': 'Raw MDX source', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
        editable.current.of(EditorState.readOnly.of(disabled)),
        EditorView.updateListener.of(update => {
          if (update.docChanged && !external.current) latest.current(update.state.doc.toString())
        }),
      ] }),
    })
    viewRef.current = view
    inputRef.current = {
      capture(inset) {
        const rect = view.contentDOM.getBoundingClientRect()
        const offset = view.posAtCoords({ x: rect.left + 2, y: Math.max(rect.top + 1, inset) }, false) ?? 0
        return { offset, top: window.scrollY < 10 }
      },
      restore(offset, inset, top) {
        if (top) { window.scrollTo({ top: 0, behavior: 'instant' }); return }
        const pos = Math.max(0, Math.min(offset, view.state.doc.length))
        view.dispatch({ effects: EditorView.scrollIntoView(pos, { y: 'start', yMargin: inset }) })
        view.requestMeasure({
          read: () => view.coordsAtPos(pos),
          write: rect => { if (rect) window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - inset), behavior: 'instant' }) },
        })
      },
    }
    return () => { inputRef.current = null; viewRef.current = null; view.destroy() }
  }, [])
  useLayoutEffect(() => {
    const view = viewRef.current
    if (!view) return
    const previous = view.state.doc.toString()
    if (previous === value) return
    // External changes (recovery, formatting, undo toolbar) retain the nearest caret.
    let from = 0, oldEnd = previous.length, newEnd = value.length
    while (from < oldEnd && from < newEnd && previous[from] === value[from]) from++
    while (oldEnd > from && newEnd > from && previous[oldEnd - 1] === value[newEnd - 1]) { oldEnd--; newEnd-- }
    external.current = true
    try { view.dispatch({ changes: { from, to: oldEnd, insert: value.slice(from, newEnd) }, annotations: Transaction.addToHistory.of(false) }) }
    finally { external.current = false }
  }, [value])
  useLayoutEffect(() => { viewRef.current?.dispatch({ effects: editable.current.reconfigure(EditorState.readOnly.of(disabled)) }) }, [disabled])
  return <div ref={host} className="studio-source-codemirror" />
}

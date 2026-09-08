'use client'
import { useState, useRef } from 'react'
import { SelectionToolbar } from './selection-toolbar'
import { InlineTools } from './inline-tools'
import { MdxPreview } from './mdx-preview'
import { ComponentMenu } from './component-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { parseMdx, insertBlock, reorderBlock, replaceBlock } from '@/lib/mdx-editor'
import { Product } from '@/lib/product-config'
import { GripVertical, Copy, Trash2, Pencil } from '@/components/icons/font-awesome'

export function VisualCanvas({ source, product, onChange, disabled, pages = [] }: { source: string; product?: Product; onChange: (source: string) => void; disabled: boolean; pages?: { title: string; slug: string }[] }) {
  const { blocks, error } = parseMdx(source)
  const [dragged, setDragged] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [epoch, setEpoch] = useState(0)
  const [raw, setRaw] = useState<{ index: number; value: string } | null>(null)
  const selection = useRef({ start: 0, end: 0 })
  const textRef = useRef<HTMLTextAreaElement>(null)
  const move = (from: number, to: number) => { onChange(reorderBlock(source, from, to)); setEpoch(x => x + 1); setDragged(null); setOver(null) }
  function format(before: string, after = before) {
    if (!raw || !textRef.current) return
    const textarea = textRef.current
    const start = textarea.selectionStart, end = textarea.selectionEnd
    const selected = raw.value.slice(start, end)
    const value = raw.value.slice(0, start) + before + selected + after + raw.value.slice(end)
    setRaw({ ...raw, value })
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, end + before.length) })
  }
  function insertInline(value: string) {
    if (!raw) return
    const { start, end } = selection.current
    setRaw({ ...raw, value: raw.value.slice(0, start) + value + raw.value.slice(end) })
    requestAnimationFrame(() => { textRef.current?.focus(); textRef.current?.setSelectionRange(start + value.length, start + value.length) })
  }
  function closeEditor() {
    if (raw && raw.value !== blocks[raw.index]?.source && !window.confirm('Discard the changes in this block?')) return
    setRaw(null)
  }

  if (error) return <div className="studio-error" role="alert">{error} · Open Source to correct this MDX.</div>
  return <div className="studio-blocks studio-direct-canvas" aria-label="Visual document editor">{blocks.map((block, index) => <div key={`${epoch}:${index}`} className={`studio-block ${over === index ? 'studio-drop-target' : ''} ${dragged === index ? 'studio-dragging' : ''}`} onDragOver={event => { if (!disabled && event.dataTransfer.types.includes('application/spark-block')) { event.preventDefault(); setOver(index) } }} onDrop={event => { if (disabled) return; const from = Number(event.dataTransfer.getData('application/spark-block')); if (event.dataTransfer.types.includes('application/spark-block') && Number.isInteger(from)) { event.preventDefault(); move(from, index) } }}>
    <div className="studio-block-rail"><DropdownMenu><DropdownMenuTrigger className="studio-block-grip" disabled={disabled} draggable={!disabled} title="Drag to move · Click for options" aria-label={`Block ${index + 1} options; drag to reorder`} onDragStart={event => { event.dataTransfer.setData('application/spark-block', String(index)); event.dataTransfer.effectAllowed = 'move'; setDragged(index) }} onDragEnd={() => { setDragged(null); setOver(null) }}><GripVertical size={15} /></DropdownMenuTrigger><DropdownMenuContent className="studio-context-menu" side="left"><DropdownMenuItem onClick={() => onChange(insertBlock(source, block.source, index + 1))}><Copy size={14} /> Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => { onChange(replaceBlock(source, block, '')); setEpoch(x => x + 1) }}><Trash2 size={14} /> Delete</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem disabled={!index} onClick={() => move(index, index - 1)}>Move up</DropdownMenuItem><DropdownMenuItem disabled={index === blocks.length - 1} onClick={() => move(index, index + 1)}>Move down</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setRaw({ index, value: block.source })}>Component properties / MDX</DropdownMenuItem></DropdownMenuContent></DropdownMenu><ComponentMenu disabled={disabled} onInsert={snippet => onChange(insertBlock(source, snippet, index + 1))} /></div>
    <button type="button" className="studio-block-pencil" disabled={disabled} title="Edit block" aria-label={`Edit block ${index + 1}`} onClick={() => setRaw({ index, value: block.source })}><Pencil size={14} /></button>
    <MdxPreview source={source} nodes={[block.node]} product={product} interactiveLinks={false} onEdit={disabled ? undefined : (node, value) => { if (node.position) onChange(source.slice(0, node.position.start.offset) + value + source.slice(node.position.end.offset)) }} />
  </div>)}<div className="studio-bottom-insert"><ComponentMenu disabled={disabled} label="Add a component" onInsert={snippet => onChange(insertBlock(source, snippet, blocks.length))} /><span>{blocks.length ? 'Add a component' : 'Add a paragraph to start writing'}</span></div>
  <SelectionToolbar pages={pages} productSlug={product?.slug ?? ""} />
  <Dialog open={raw !== null} onOpenChange={open => { if (!open) closeEditor() }}><DialogContent className="studio-dialog sm:max-w-2xl"><DialogTitle>Edit block</DialogTitle><DialogDescription>Write or paste your text below. Apply changes to update this block.</DialogDescription><div className="studio-block-formatting" role="toolbar" aria-label="Block text formatting" onMouseDown={event => event.preventDefault()}><button type="button" aria-label="Bold" onClick={() => format('**')}><b>B</b></button><button type="button" aria-label="Italic" onClick={() => format('*')}><i>I</i></button><button type="button" aria-label="Underline" onClick={() => format('<u>', '</u>')}><u>U</u></button><button type="button" aria-label="Strikethrough" onClick={() => format('<s>', '</s>')}><s>S</s></button><button type="button" aria-label="Inline code" onClick={() => format('`')}>&lt;/&gt;</button><button type="button" aria-label="Insert link" onClick={() => format('[', '](https://example.com)')}>Link</button></div><InlineTools key={raw?.index ?? "closed"} selectedText={() => raw?.value.slice(selection.current.start, selection.current.end) ?? ""} onInsert={insertInline} /><textarea onSelect={event => { selection.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd } }} ref={textRef} autoFocus spellCheck={false} aria-label="Component MDX" className="studio-source" value={raw?.value ?? ''} onChange={event => setRaw(raw ? { ...raw, value: event.target.value } : null)} />{raw && parseMdx(raw.value).error && <p role="alert">{parseMdx(raw.value).error}</p>}<div className="studio-block-dialog-actions"><button type="button" onClick={closeEditor}>Cancel</button><button className="studio-save" disabled={!raw || !!parseMdx(raw.value).error} onClick={() => { if (raw && blocks[raw.index]) { onChange(replaceBlock(source, blocks[raw.index], raw.value)); setEpoch(x => x + 1); setRaw(null) } }}>Apply changes</button></div></DialogContent></Dialog>
  </div>
}

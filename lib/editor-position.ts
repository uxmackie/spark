export type EditorPosition = { offset: number; top: boolean }
export function lineOffset(text: string, line: number) {
  let offset = 0
  for (let i = 0; i < line; i++) { const next = text.indexOf('\n', offset); if (next < 0) return text.length; offset = next + 1 }
  return offset
}
export function capturePosition(container: HTMLElement | null, textarea: HTMLTextAreaElement | null, raw: string, body: string, inset: number): EditorPosition {
  if (window.scrollY < 10 && (!textarea || textarea.scrollTop < 10)) return { offset: 0, top: true }
  if (textarea) {
    const lines = Array.from(container?.querySelectorAll<HTMLElement>('[data-source-start]') ?? [])
    const visible = lines.find(el => el.getBoundingClientRect().bottom > inset) ?? lines.at(-1)
    if (visible) {
      const rect = visible.getBoundingClientRect()
      const start = Number(visible.dataset.sourceStart)
      const end = Number(visible.dataset.sourceEnd)
      const fraction = Math.max(0, Math.min(1, (inset - rect.top) / Math.max(1, rect.height)))
      return { offset: Math.max(0, Math.round(start + fraction * (end - start)) - Math.max(0, raw.indexOf(body))), top: false }
    }
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 18
    const hidden = Math.max(0, inset - textarea.getBoundingClientRect().top - parseFloat(getComputedStyle(textarea).paddingTop))
    return { offset: Math.max(0, lineOffset(raw, Math.floor((textarea.scrollTop + hidden) / lineHeight)) - Math.max(0, raw.indexOf(body))), top: false }
  }
  const blocks = Array.from(container?.querySelectorAll<HTMLElement>('[data-editor-offset]') ?? [])
  const block = blocks.find(el => el.getBoundingClientRect().bottom > inset) ?? blocks.at(-1)
  const start = Number(block?.dataset.editorOffset ?? 0)
  const end = Number(blocks[blocks.indexOf(block!) + 1]?.dataset.editorOffset ?? body.length)
  const rect = block?.getBoundingClientRect()
  const fraction = rect ? Math.max(0, Math.min(1, (inset - rect.top) / Math.max(1, rect.height))) : 0
  return { offset: Math.round(start + fraction * (end - start)), top: false }
}
export function restorePosition(position: EditorPosition, container: HTMLElement | null, textarea: HTMLTextAreaElement | null, raw: string, body: string, inset: number) {
  if (position.top) { if (textarea) textarea.scrollTop = 0; window.scrollTo({ top: 0, behavior: 'instant' }); return }
  if (textarea) {
    const offset = Math.max(0, raw.indexOf(body)) + position.offset
    const lines = Array.from(container?.querySelectorAll<HTMLElement>('[data-source-start]') ?? [])
    const target = lines.filter(el => Number(el.dataset.sourceStart) <= offset).at(-1)
    if (target) {
      const start = Number(target.dataset.sourceStart)
      const end = Number(target.dataset.sourceEnd)
      const fraction = Math.max(0, Math.min(1, (offset - start) / Math.max(1, end - start)))
      const rect = target.getBoundingClientRect()
      window.scrollTo({ top: Math.max(0, window.scrollY + rect.top + fraction * rect.height - inset), behavior: 'instant' })
      return
    }
    const line = raw.slice(0, offset).split('\n').length - 1
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 18
    const wanted = line * lineHeight
    textarea.scrollTop = wanted
    const remainder = Math.max(0, wanted - textarea.scrollTop)
    window.scrollTo({ top: Math.max(0, window.scrollY + textarea.getBoundingClientRect().top + parseFloat(getComputedStyle(textarea).paddingTop) + remainder - inset), behavior: 'instant' })
    return
  }
  const blocks = Array.from(container?.querySelectorAll<HTMLElement>('[data-editor-offset]') ?? [])
  const block = blocks.filter(el => Number(el.dataset.editorOffset) <= position.offset).at(-1) ?? blocks[0]
  if (block) {
    const start = Number(block.dataset.editorOffset)
    const end = Number(blocks[blocks.indexOf(block) + 1]?.dataset.editorOffset ?? body.length)
    const fraction = Math.max(0, Math.min(1, (position.offset - start) / Math.max(1, end - start)))
    const rect = block.getBoundingClientRect()
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top + fraction * rect.height - inset), behavior: 'instant' })
  }
}

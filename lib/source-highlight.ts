export type SourceToken = { text: string; kind: string }
/** Presentation only: never parses or rewrites the editable document. */
export function highlightSource(source: string): SourceToken[] {
  const tokens: SourceToken[] = []
  const pattern = /<!--[^]*?(?:-->|$)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<\/?[A-Za-z][\w.:-]*|\/?>(?=\s|$)|\b[\w-]+(?=\s*=)|^---\s*$|^[\w-]+(?=:)|^#{1,6}(?= )|`[^`\n]*`/gm
  let offset = 0
  for (const match of source.matchAll(pattern)) {
    const start = match.index!
    if (start > offset) tokens.push({ text: source.slice(offset, start), kind: '' })
    const text = match[0]
    const kind = text.startsWith('<!--') || text.trim() === '---' ? 'muted' : /^["']/.test(text) ? 'string' : /^<|>$/.test(text) ? 'tag' : text.startsWith('`') ? 'string' : 'key'
    tokens.push({ text, kind }); offset = start + text.length
  }
  if (offset < source.length) tokens.push({ text: source.slice(offset), kind: '' })
  return tokens
}

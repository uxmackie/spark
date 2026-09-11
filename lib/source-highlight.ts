export type SourceToken = { text: string; kind: string }

/** Presentation only. Every character, including Markdown delimiters, is retained. */
export function highlightSource(source: string): SourceToken[] {
  const tokens: SourceToken[] = []
  const push = (text: string, kind = '') => { if (text) tokens.push({ text, kind }) }
  function inline(text: string, inherited = '') {
    const pattern = /\\[^\n]|`+[^`\n]*`+|<\/?[A-Za-z][^>\n]*(?:>|$)|\*\*\*([^\n]+?)\*\*\*|___([^\n]+?)___|\*\*([^\n]+?)\*\*|__([^\n]+?)__|\*([^*\n]+?)\*|(?<!\w)_([^_\n]+?)_(?!\w)/g
    let offset = 0
    for (const match of text.matchAll(pattern)) {
      push(text.slice(offset, match.index), inherited)
      const value = match[0]
      if (value.startsWith('<')) {
        const parts = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[\w:-]+(?=\s*=)/g
        let start = 0
        for (const part of value.matchAll(parts)) {
          push(value.slice(start, part.index), 'tag')
          push(part[0], /^["']/.test(part[0]) ? 'string' : 'key')
          start = part.index! + part[0].length
        }
        push(value.slice(start), 'tag')
      } else if (value.startsWith('`')) push(value, 'string')
      else if (value.startsWith('\\')) push(value, inherited)
      else {
        const both = match[1] !== undefined || match[2] !== undefined
        const bold = both || match[3] !== undefined || match[4] !== undefined
        const kind = both || inherited === 'bold' && !bold || inherited === 'italic' && bold ? 'bold-italic' : bold ? 'bold' : 'italic'
        const count = both ? 3 : bold ? 2 : 1
        push(value.slice(0, count), kind)
        inline(value.slice(count, -count), kind)
        push(value.slice(-count), kind)
      }
      offset = match.index! + value.length
    }
    push(text.slice(offset), inherited)
  }
  let fence = '', fenceSize = 0, yaml = false
  source.split('\n').forEach((line, index, lines) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (fence) {
      push(line, 'string')
      if (marker && marker[1][0] === fence && marker[1].length >= fenceSize && !line.slice(marker[0].length).trim()) fence = ''
    } else if (marker) {
      fence = marker[1][0]; fenceSize = marker[1].length; push(line, 'string')
    } else if ((index === 0 || yaml) && line.trim() === '---') {
      yaml = !yaml; push(line, 'muted')
    } else if (yaml) {
      const key = line.match(/^([\w-]+:)(.*)$/)
      if (key) { push(key[1], 'key'); push(key[2], 'string') } else push(line, 'string')
    } else if (/^ {0,3}#{1,6}(?:\s|$)/.test(line)) push(line, 'heading')
    else inline(line)
    if (index < lines.length - 1) push('\n')
  })
  return tokens
}

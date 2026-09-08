import { iconMarkup } from '@/lib/fa-icons'
import type { MdxNode } from '@/lib/mdx-editor'
export const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export function inlineHtml(nodes: MdxNode[], source: string): string {
  return nodes.map(node => {
    const inner = inlineHtml(node.children ?? [], source)
    if (node.type === 'text') return escapeHtml(node.value ?? '').replace(/\n/g, '<br>')
    if (node.type === 'strong') return `<strong>${inner}</strong>`
    if (node.type === 'emphasis') return `<em>${inner}</em>`
    if (node.type === 'inlineCode') return `<code>${escapeHtml(node.value ?? '')}</code>`
    if (node.name === 'br' || node.type === 'break') return '<br>'
    if (node.type === 'link' && /^(https?:|mailto:|\/|#)/.test(node.url ?? '') && !/[\s\\]/.test(node.url ?? '')) return `<a href="${escapeHtml(node.url!)}"${node.title ? ` title="${escapeHtml(node.title)}"` : ''}>${inner}</a>`
    if (['u', 's', 'del', 'strong', 'em'].includes(node.name ?? '')) return `<${node.name}>${inner}</${node.name}>`
    const raw = node.position ? source.slice(node.position.start.offset, node.position.end.offset) : node.value ?? ''
    const attribute = (name: string) => { const value = node.attributes?.find(attr => attr.name === name)?.value; if (typeof value === 'string') return value; const expression = (value as { data?: { estree?: { body?: { expression?: { type?: string; value?: unknown } }[] } } })?.data?.estree?.body?.[0]?.expression; return expression?.type === 'Literal' && typeof expression.value === 'string' ? expression.value : undefined }
    const display = ['Icon', 'Emoji'].includes(node.name ?? '') ? iconMarkup(attribute('icon') ?? 'face-smile') : node.name === 'Tooltip' ? inner : escapeHtml(raw)
    return `<span contenteditable="false" data-mdx-raw="${escapeHtml(raw)}" title="${escapeHtml(attribute('tip') ?? (node.name === 'Tooltip' ? 'Tooltip' : attribute('icon') ?? 'MDX component'))}">${display}</span>`
  }).join('')
}
const escapeMarkdown = (value: string) => value.replace(/([\\`*_[\]{}<>])/g, '\\$1')
export function domToMarkdown(root: Node): string {
  const wrap = (text: string, marker: string) => text.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, before, content, after) => content ? before + marker + content + marker + after : text)
  function walk(node: Node): string {
    if (node.nodeType === 3) return escapeMarkdown(node.textContent ?? '').replace(/\u00a0/g, ' ').replace(/^(\s*)(#{1,6}|[-+])(?=\s)/gm, '$1\\$2')
    if (node.nodeType !== 1) return ''
    const element = node as HTMLElement
    if (element.dataset.mdxRaw !== undefined) return element.dataset.mdxRaw
    const text = Array.from(element.childNodes).map(walk).join('')
    switch (element.tagName.toLowerCase()) {
      case 'b': case 'strong': return wrap(text, '**')
      case 'i': case 'em': return wrap(text, '*')
      case 'u': return `<u>${text}</u>`
      case 's': case 'strike': case 'del': return `<s>${text}</s>`
      case 'code': { const value = element.textContent ?? ''; const fence = '`'.repeat(Math.max(1, ...Array.from(value.matchAll(/`+/g), m => m[0].length + 1))); return `${fence}${value.startsWith('`') ? ' ' : ''}${value}${value.endsWith('`') ? ' ' : ''}${fence}` }
      case 'br': return '<br />'
      case 'a': { const href = element.getAttribute('href') ?? ''; return /^(https?:|mailto:|\/|#)/i.test(href) && !/[\s\\]/.test(href) ? `[${text}](${href.replace(/\(/g, '%28').replace(/\)/g, '%29')}${element.title ? ` "${element.title.replace(/"/g, '&quot;')}"` : ''})` : text }
      case 'div': case 'p': return `${text}  \n`
      default: return text
    }
  }
  return Array.from(root.childNodes).map(walk).join('')
}

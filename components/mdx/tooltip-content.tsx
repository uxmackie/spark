'use client'
import { createElement, Fragment, useMemo, type ElementType, type ReactNode } from 'react'
import { parseMdx, type MdxNode } from '@/lib/mdx-editor'

export function TooltipContent({ source, components, safeUrl }: { source: string; components: Record<string, ElementType>; safeUrl: (value: unknown) => string | undefined }) {
  const parsed = useMemo(() => parseMdx(source), [source])
  if (parsed.error) return <div className="mdx-tooltip-content mdx-tooltip-plain">{source}</div>
  function render(node: MdxNode, key: number, depth = 0): ReactNode {
    const raw = () => <code key={key}>{node.position ? source.slice(node.position.start.offset, node.position.end.offset) : node.value ?? ''}</code>
    if (depth > 24) return raw()
    const children = node.children?.map((child, index) => render(child, index, depth + 1))
    if (node.type === 'text') return node.value
    const tags: Record<string, string> = { paragraph: 'p', strong: 'strong', emphasis: 'em', delete: 's', blockquote: 'blockquote', listItem: 'li', break: 'br', thematicBreak: 'hr' }
    if (tags[node.type]) return createElement(tags[node.type], { key }, children)
    if (node.type === 'heading') return createElement(`h${node.depth ?? 3}`, { key }, children)
    if (node.type === 'list') return createElement(node.ordered ? 'ol' : 'ul', { key, start: node.ordered ? node.start : undefined }, children)
    if (node.type === 'inlineCode') return <code key={key}>{node.value}</code>
    if (node.type === 'code') return <pre key={key}><code>{node.value}</code></pre>
    if (node.type === 'link') return <a key={key} href={safeUrl(node.url)} title={node.title}>{children}</a>
    if (node.type === 'image') return <img key={key} src={safeUrl(node.url)} alt={node.alt ?? ''} />
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (!node.name) return <Fragment key={key}>{children}</Fragment>
      const component = Object.hasOwn(components, node.name) ? components[node.name] : ['br', 'strong', 'em', 'u', 's', 'p', 'span', 'a', 'code'].includes(node.name) ? node.name : undefined
      if (!component) return raw()
      const props: Record<string, unknown> = { key }
      for (const attr of node.attributes ?? []) {
        if (attr.type !== 'mdxJsxAttribute' || !attr.name) return raw()
        let value = attr.value
        if (typeof value === 'object' && value) {
          const expression = (value as { data?: { estree?: { body?: { expression?: { type?: string; value?: unknown } }[] } } }).data?.estree?.body?.[0]?.expression
          if (expression?.type !== 'Literal') return raw()
          value = expression.value
        }
        if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) return raw()
        if (['title', 'icon', 'label', 'tip', 'headline', 'cta', 'caption', 'cols'].includes(attr.name)) props[attr.name] = value
        if (['href', 'src', 'img'].includes(attr.name)) props[attr.name] = safeUrl(value)
      }
      return createElement(component, props, children)
    }
    // Imports, JS expressions and custom components remain text, never executable.
    return raw()
  }
  return <div className="mdx-tooltip-content">{parsed.blocks.map(({ node }, index) => render(node, index))}</div>
}

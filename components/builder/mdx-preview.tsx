'use client'
import { EditableText } from './editable-text'
import { inlineHtml, escapeHtml } from '@/lib/rich-text'
import { createElement, Fragment, type ReactNode } from 'react'
import { mdxComponents, safeUrl } from '@/components/mdx/components'
import { GettingStartedCards, Principles, ProductCards, WelcomeBanner } from '@/components/docs/content-blocks'
import type { Product } from '@/lib/product-config'
import { parseMdx, type MdxNode } from '@/lib/mdx-editor'

function literal(value: unknown): unknown {
  if (value === null) return true
  if (typeof value === 'string') return value
  const expression = (value as { data?: { estree?: { body?: { expression?: { type?: string; value?: unknown } }[] } } })?.data?.estree?.body?.[0]?.expression
  return expression?.type === 'Literal' ? expression.value : undefined
}
export function MdxPreview({ source, nodes, product, interactiveLinks = true, onEdit }: { source?: string; nodes?: MdxNode[]; product?: Product; interactiveLinks?: boolean; onEdit?: (node: MdxNode, value: string) => void }) {
  const parsed = nodes ? { blocks: nodes.map(node => ({ node })), error: null } : parseMdx(source ?? '')
  function render(node: MdxNode, key: number): ReactNode {
    if (onEdit && (node.type === 'paragraph' || node.type === 'heading')) {
      const prefix = node.type === 'heading' ? '#'.repeat(node.depth ?? 2) + ' ' : ''
      return <EditableText key={key} onCommand={value => onEdit(node, value)} tag={node.type === 'heading' ? `h${node.depth}` : 'p'} label={node.type === 'heading' ? 'Heading' : 'Paragraph'} html={inlineHtml(node.children ?? [], source ?? '')} onChange={value => onEdit(node, prefix + (value || '{/* spark-empty */}'))} onStyle={style => { const body = (source ?? '').slice(node.position!.start.offset, node.position!.end.offset).replace(/^#{1,6} /, ''); onEdit(node, style === 'paragraph' ? body : /^h[1-3]$/.test(style) ? '#'.repeat(Number(style[1])) + ' ' + body : (style === 'ol' ? '1. ' : '- ') + body) }} />
    }
    if (onEdit && node.type === 'mdxFlowExpression' && node.value?.trim() === '/* spark-empty */') return <EditableText key={key} onCommand={value => onEdit(node, value)} tag="p" label="Paragraph" html="" onChange={value => onEdit(node, value || '{/* spark-empty */}')} />
    const children = node.children?.map(render)
    const props: Record<string, unknown> = { key }
    if (node.type === 'mdxFlowExpression' && node.value?.trim() === '/* spark-empty */') return <p key={key} className="studio-muted">Empty paragraph</p>
    if (node.type === 'text') return node.value
    const tags: Record<string, string> = { paragraph: 'p', strong: 'strong', emphasis: 'em', delete: 'del', blockquote: 'blockquote', listItem: 'li', thematicBreak: 'hr', break: 'br' }
    if (tags[node.type]) return createElement(tags[node.type], props, children)
    if (node.type === 'heading') return createElement(`h${node.depth ?? 2}`, props, children)
    if (node.type === 'list') return createElement(node.ordered ? 'ol' : 'ul', { ...props, start: node.start }, children)
    if (node.type === 'inlineCode') return <code key={key}>{node.value}</code>
    if (node.type === 'code') return <div key={key} className="mdx-code"><div>{node.meta ?? node.lang ?? 'Code'}</div><pre><code>{node.value}</code></pre></div>
    if (node.type === 'link') return <a key={key} href={safeUrl(node.url)} title={node.title}>{children}</a>
    if (node.type === 'image') return <img key={key} src={safeUrl(node.url)} alt={node.alt ?? ''} title={node.title} />
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (!node.name) return <Fragment key={key}>{children}</Fragment>
      let dynamic = false
      for (const attr of node.attributes ?? []) {
        if (attr.type !== 'mdxJsxAttribute' || !attr.name) { dynamic = true; continue }
        const value = literal(attr.value)
        if (value === undefined) dynamic = true
        if (['title', 'icon', 'href', 'img', 'cols', 'caption', 'alt', 'src', 'tip', 'headline', 'cta', 'label'].includes(attr.name)) props[attr.name] = value
        if (onEdit && typeof value === 'string' && attr.position && ((attr.name === 'title' && ['Card', 'Tab', 'Step', 'Accordion'].includes(node.name)) || (attr.name === 'caption' && node.name === 'Frame'))) {
          props[attr.name] = <EditableText tag="span" plain multiline={false} label={`${node.name} ${attr.name}`} html={escapeHtml(value)} onChange={text => onEdit({ type: 'attribute', position: attr.position }, `${attr.name}={${JSON.stringify(text)}}`)} />
        }

      }
      if (dynamic) return <div className="mdx-unsupported" key={key}>Dynamic {node.name} props preserved. Preview on your trusted docs site.</div>
      if (node.name in mdxComponents) return createElement(mdxComponents[node.name as keyof typeof mdxComponents], props, children)
      if (node.name === 'WelcomeBanner') return <WelcomeBanner key={key} />
      if (node.name === 'Principles') return <Principles key={key} />
      if (node.name === 'GettingStartedCards') return <GettingStartedCards key={key} productSlug={product?.slug} />
      if (node.name === 'ProductCards') return <ProductCards key={key} products={product ? [product] : []} />
      if (['div', 'span', 'p', 'strong', 'em', 'u', 's', 'del', 'br', 'hr', 'figure', 'figcaption', 'a', 'img'].includes(node.name)) {
        if (props.href) props.href = safeUrl(props.href)
        if (props.src) props.src = safeUrl(props.src)
        return createElement(node.name, props, children?.length ? children : undefined)
      }
      return <div className="mdx-unsupported" key={key}>&lt;{node.name}&gt; · Custom component preserved{children}</div>
    }
    return <div className="mdx-unsupported" key={key}>{node.type === 'mdxjsEsm' ? 'Import / export' : 'Expression or unsupported Markdown'} · Preserved in source</div>
  }
  return <div className="doc-prose" onClick={!interactiveLinks ? event => { if ((event.target as HTMLElement).closest('a')) event.preventDefault() } : undefined}>{parsed.error ? <div role="alert" className="studio-error">{parsed.error}</div> : parsed.blocks.map(({ node }, key) => render(node, key))}</div>
}

import type { MdxNode } from '@/lib/mdx-editor'

// next-mdx-remote blocks JSX expressions by default. Preserve only parsed string
// literals as plain attributes before that sanitizer runs; never evaluate code.
export function literalAttributes() {
  return (tree: MdxNode) => {
    const visit = (node: MdxNode) => {
      for (const attribute of node.attributes ?? []) {
        if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.value !== 'object' || !attribute.value) continue
        const value = attribute.value as { type?: string; data?: { estree?: { body?: { type?: string; expression?: { type?: string; value?: unknown } }[] } } }
        const body = value.data?.estree?.body
        if (value.type !== 'mdxJsxAttributeValueExpression' || body?.length !== 1 || body[0].type !== 'ExpressionStatement') continue
        const expression = body[0].expression
        if (expression?.type === 'Literal' && typeof expression.value === 'string') attribute.value = expression.value
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

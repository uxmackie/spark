import { parse, stringify } from 'yaml'
export type MdxDocument = { title: string; description: string; draft: boolean; source: string; frontmatter?: Record<string, unknown> }
export function serializeDocument(page: MdxDocument) {
  return `---\n${stringify({ ...page.frontmatter, title: page.title, description: page.description, draft: page.draft }, { lineWidth: 0 }).trimEnd()}\n---\n${page.source}`
}
export function parseDocument(raw: string): MdxDocument {
  const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw)
  if (!match) throw new Error('Start the file with YAML frontmatter between --- lines.')
  const data = parse(match[1], { maxAliasCount: 50 })
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Frontmatter must contain named fields.')
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('Frontmatter needs a title.')
  if (data.description !== undefined && typeof data.description !== 'string') throw new Error('Description must be text.')
  if (data.draft !== undefined && typeof data.draft !== 'boolean') throw new Error('Draft must be true or false.')
  return { title: data.title, description: data.description ?? '', draft: data.draft ?? false, frontmatter: data, source: raw.slice(match[0].length) }
}

export function documentSource(page: MdxDocument & { rawSource?: string }) {
  if (page.rawSource) {
    try { if (serializeDocument(parseDocument(page.rawSource)) === serializeDocument(page)) return page.rawSource } catch { /* Rebuild from the valid page model. */ }
  }
  return serializeDocument(page)
}

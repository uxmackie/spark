import { collectHeadings } from '@/lib/headings'
import 'server-only'
import { readdir, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { parseProductConfig, slugSchema, type PageInfo, type Product, headingId } from '@/lib/product-config'

const contentRoot = path.join(process.cwd(), 'content')

async function safePath(...segments: string[]) {
  const root = await realpath(contentRoot)
  const target = await realpath(path.join(root, ...segments))
  if (!target.startsWith(root + path.sep)) throw new Error('Invalid content path')
  return target
}

export async function getProducts(): Promise<Product[]> {
  const folders = await readdir(contentRoot, { withFileTypes: true })
  const products = await Promise.all(folders.filter(folder => folder.isDirectory() && slugSchema.safeParse(folder.name).success).map(async folder => {
    let raw: unknown = {}
    try {
      raw = JSON.parse(await readFile(await safePath(folder.name, 'config.json'), 'utf8'))
    } catch (error) {
      if (!(error instanceof SyntaxError) && (error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    const config = parseProductConfig(raw)
    const pages = await getPageList(folder.name)
    const existing = new Set(pages.map(page => page.slug))
    config.navigation = config.navigation.map(group => ({ ...group, pages: group.pages.filter(page => existing.has(page.slug)) })).filter(group => group.pages.length > 0)
    const configured = new Set(config.navigation.flatMap(group => group.pages.map(page => page.slug)))
    const remaining = pages.filter(page => !configured.has(page.slug))
    if (remaining.length) config.navigation.push({ group: 'Documentation', pages: remaining.map(page => ({ title: page.title, slug: page.slug, icon: 'file' as const })) })
    return { slug: folder.name, config }
  }))
  return products.sort((a, b) => a.slug === 'dev-docs' ? -1 : b.slug === 'dev-docs' ? 1 : a.slug.localeCompare(b.slug))
}

export async function getPageList(product: string): Promise<PageInfo[]> {
  slugSchema.parse(product)
  async function walk(directory: string, prefix = ''): Promise<PageInfo[]> {
    const entries = await readdir(directory, { withFileTypes: true })
    const pages = await Promise.all(entries.map(async entry => {
      if (entry.isSymbolicLink()) return []
      if (entry.isDirectory() && slugSchema.safeParse(entry.name).success) return walk(path.join(directory, entry.name), `${prefix}${entry.name}/`)
      if (!entry.isFile() || !/^[a-z0-9-]+\.mdx$/.test(entry.name)) return []
      const slug = `${prefix}${entry.name.slice(0, -4)}`
      const { data } = matter(await readFile(path.join(directory, entry.name), 'utf8'))
      return [{ slug, product, title: typeof data.title === 'string' ? data.title : slug, description: typeof data.description === 'string' ? data.description : '' }]
    }))
    return pages.flat()
  }
  return walk(await safePath(product))
}

export async function getDocument(product: string, segments: string[]) {
  if (!slugSchema.safeParse(product).success || !segments.length || !segments.every(s => slugSchema.safeParse(s).success)) return null
  try {
    const raw = await readFile(await safePath(product, `${segments.join('/')}.mdx`), 'utf8')
    const { data, content } = matter(raw)
    const headings = collectHeadings(content)
    return { source: content, title: typeof data.title === 'string' ? data.title : segments.at(-1)!, description: typeof data.description === 'string' ? data.description : '', headings }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

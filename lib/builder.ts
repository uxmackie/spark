import 'server-only'
import { navigationTreeSchema, renameNavigationPage, insertNavigation } from '@/lib/navigation'
import { documentSource } from '@/lib/raw-mdx'
import { mkdir, readFile, writeFile, rm, rename, lstat } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import { getPageList, getProducts } from '@/lib/content'
import { parseProductConfig, productConfigSchema, slugSchema, type ProductConfig } from '@/lib/product-config'
import { parseMdx } from '@/lib/mdx-editor'
const root = path.join(process.cwd(), 'content')
const pageSlug = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/
const revision = (raw: string) => createHash('sha256').update(raw).digest('hex')
async function contentPath(product: string, file = '') {
  slugSchema.parse(product)
  const target = path.resolve(root, product, file)
  if (!target.startsWith(path.resolve(root, product) + path.sep) && target !== path.resolve(root, product)) throw new Error('Invalid content path')
  const parts = path.relative(root, target).split(path.sep)
  let current = root
  for (const part of ['', ...parts]) {
    current = path.join(/* turbopackIgnore: true */ current, part)
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('Symbolic links are not editable') }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  }
  return target
}
async function readOptional(file: string) { try { return await readFile(file, 'utf8') } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error } }
async function atomicWrite(file: string, source: string) {
  await mkdir(path.dirname(file), { recursive: true })
  const temp = `${file}.${randomUUID()}.tmp`
  try { await writeFile(temp, source, { flag: 'wx' }); await rename(temp, file) } finally { await rm(temp, { force: true }) }
}
// Serialize writes in this Node process so stale revisions cannot race each other.
let writes: Promise<unknown> = Promise.resolve()
function exclusive<T>(work: () => Promise<T>): Promise<T> { const pending = writes.then(work, work); writes = pending.catch(() => {}); return pending }
export type BuilderPage = { slug: string; title: string; description: string; source: string; draft: boolean; fileName: string; revision: string; rawSource: string; frontmatter: Record<string, unknown> }
export type BuilderProduct = { slug: string; config: ProductConfig; pages: BuilderPage[] }
export async function readBuilderProduct(slug: string): Promise<BuilderProduct> {
  const product = (await getProducts({ includeDrafts: true })).find(item => item.slug === slug)
  if (!product) throw new Error('Product not found')
  const pages = await getPageList(slug, { includeDrafts: true })
  return { ...product, pages: await Promise.all(pages.map(async page => {
    const raw = await readFile(await contentPath(slug, `${page.slug}.mdx`), 'utf8')
    const parsed = matter(raw)
    return { ...page, source: parsed.content, draft: parsed.data.draft === true, fileName: `${page.slug}.mdx`, revision: revision(raw), rawSource: raw, frontmatter: parsed.data }
  })) }
}
export async function saveProduct(input: { originalSlug?: string; slug: string; config: unknown; create?: boolean }) {
  return exclusive(async () => {
    const slug = slugSchema.parse(input.slug)
    if (input.originalSlug && input.originalSlug !== slug) throw new Error('Product folder renaming is not supported in the editor')
    const config = productConfigSchema.parse(input.config)
    const file = await contentPath(slug, 'config.json')
    const directory = await contentPath(slug)
    let exists = false
    try { exists = (await lstat(directory)).isDirectory() } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    if (!input.create && !exists) throw new Error('Product no longer exists. Reload before saving.')
    if (input.create && exists) throw new Error('A product with that path already exists')
    await atomicWrite(file, `${JSON.stringify(config, null, 2)}\n`)
    return { slug, config }
  })
}
const pageInput = z.object({
  product: slugSchema, slug: z.string().regex(pageSlug), originalSlug: z.string().regex(pageSlug).optional(),
  title: z.string().trim().min(1).max(300), description: z.string().max(4000), source: z.string().max(2_000_000),
  draft: z.boolean(), expectedRevision: z.string().optional(), create: z.boolean().optional(),
  rawSource: z.string().max(2_100_000).optional(),
  frontmatter: z.record(z.string(), z.unknown()).optional(), navigationParent: z.string().nullable().optional(),
  fileName: z.string().optional(), originalFileName: z.string().optional(),
})
export async function savePage(value: unknown) {
  return exclusive(async () => {
    const input = pageInput.parse(value)
    const fileName = `${input.slug}.mdx`
    const originalSlug = input.originalSlug ?? input.slug
    if (input.fileName && input.fileName !== fileName) throw new Error('The MDX filename must match the page path')
    if (input.originalFileName && input.originalFileName !== `${originalSlug}.mdx`) throw new Error('Invalid original filename')
    const parse = parseMdx(input.source)
    if (parse.error) throw new Error(`Fix the MDX before saving: ${parse.error}`)
    const target = await contentPath(input.product, fileName)
    const previous = await contentPath(input.product, `${originalSlug}.mdx`)
    const raw = await readOptional(previous)
    if (input.create && raw !== null) throw new Error('A page with that path already exists')
    if (!input.create && raw === null) throw new Error('The original page no longer exists. Reload before saving')
    if (raw !== null && (!input.expectedRevision || revision(raw) !== input.expectedRevision)) throw new Error('This page changed on disk. Export your edits, then reload the page before saving')
    if (target !== previous && await readOptional(target) !== null) throw new Error('The destination page already exists. Choose another path')
    const metadata = raw === null ? {} : matter(raw).data
    const output = documentSource({ ...input, frontmatter: input.frontmatter ?? metadata })
    const configPath = await contentPath(input.product, 'config.json')
    const configRaw = await readOptional(configPath)
    if (configRaw === null) {
      try { if (!(await lstat(await contentPath(input.product))).isDirectory()) throw new Error('Missing product') }
      catch { throw new Error('Product no longer exists. Reload before saving.') }
    }
    const config = configRaw ? JSON.parse(configRaw) : parseProductConfig({})
    await atomicWrite(target, output)
    if (config) {
      if (config.navigationTree) {
        config.navigationTree = renameNavigationPage(config.navigationTree, originalSlug, input.slug, input.title)
        if (input.create) config.navigationTree = insertNavigation(config.navigationTree, { id: randomUUID(), type: 'page', slug: input.slug, title: input.title, icon: 'file' }, input.navigationParent ?? null)
      }
      if (Array.isArray(config.navigation)) {
        config.navigation = config.navigation.map((group: { pages?: { slug: string; title: string }[] }) => ({ ...group, pages: group.pages?.map(item => item.slug === originalSlug ? { ...item, slug: input.slug, title: input.title } : item) ?? [] }))
        await atomicWrite(configPath, JSON.stringify(config, null, 2) + '\n')
      }
    }
    // Remove the old file only after the complete replacement is safely written.
    if (target !== previous) await rm(previous)
    return { product: input.product, slug: input.slug, fileName, revision: revision(output), rawSource: output }
  })
}
export function normalizeConfig(input: unknown) { return parseProductConfig(input) }
export async function readPageSource(product: string, slug: string) {
  if (!pageSlug.test(slug)) throw new Error('Invalid page path')
  return readFile(await contentPath(product, `${slug}.mdx`), 'utf8')
}

export async function saveNavigation(input: { product: string; tree: unknown; expectedTree?: unknown }) {
  return exclusive(async () => {
    const tree = navigationTreeSchema.parse(input.tree)
    const file = await contentPath(input.product, 'config.json')
    const raw = await readFile(file, 'utf8')
    const config = JSON.parse(raw)
    if (JSON.stringify(config.navigationTree ?? null) !== JSON.stringify(input.expectedTree ?? null)) throw new Error('Navigation changed on disk. Reload the product before saving your navigation.')
    await atomicWrite(file, JSON.stringify({ ...config, navigationTree: tree }, null, 2) + '\n')
    return { tree }
  })
}

export async function deleteProduct(value: unknown) {
  return exclusive(async () => {
    const input = z.object({ slug: slugSchema, confirmation: z.string() }).parse(value)
    if (input.confirmation !== input.slug) throw new Error('Type the product path to confirm deletion.')
    const directory = await contentPath(input.slug)
    try {
      if (!(await lstat(directory)).isDirectory()) throw new Error('Product not found')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('Product not found')
      throw error
    }
    try { await rm(directory, { recursive: true, maxRetries: 5, retryDelay: 200 }) }
    catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'EPERM' || code === 'EACCES' || code === 'EBUSY' || code === 'ENOTEMPTY') {
        throw new Error('The product folder could not be fully deleted. Close programs using its files, check folder permissions, then try again.')
      }
      throw error
    }
    return { slug: input.slug }
  })
}

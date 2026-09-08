import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import matter from 'gray-matter'

// Compile the production helpers for isolated Node tests, without a Next server.
const project = process.cwd()
const compiled = await mkdtemp(path.join(project, '.editor-test-'))
const fixture = await mkdtemp(path.join(tmpdir(), 'spark-editor-'))
for (const file of ['fa-icons', 'inline-mdx', 'headings', 'icon-catalog', 'navigation', 'raw-mdx', 'mdx-editor', 'product-config', 'content', 'builder']) {
  let source = await readFile(path.join(project, 'lib', `${file}.ts`), 'utf8')
  source = source.replace("import 'server-only'", '').replaceAll(/'@\/lib\/([^']+)'/g, "'./$1.mjs'")
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  await writeFile(path.join(compiled, `${file}.mjs`), result.outputText)
}
process.chdir(fixture)
const { parseMdx, replaceBlock, moveBlock, componentCatalog } = await import(path.join(compiled, 'mdx-editor.mjs'))
const { savePage, readBuilderProduct, saveNavigation } = await import(path.join(compiled, 'builder.mjs'))
const { parseProductConfig } = await import(path.join(compiled, 'product-config.mjs'))
const raw = '---\ntitle: Original\ndescription: Example\nicon: rocket\ncustom:\n  retained: true\n---\n\n## Hello\n\nKeep **this**.\n'
await mkdir(path.join(fixture, 'content', 'demo'), { recursive: true })
await writeFile(path.join(fixture, 'content', 'demo', 'index.mdx'), raw)
await writeFile(path.join(fixture, 'content', 'demo', 'config.json'), JSON.stringify(parseProductConfig({ navigation: [{ group: 'Start', pages: [{ slug: 'index', title: 'Original' }] }] })))
const baseline = (await readBuilderProduct('demo')).pages[0]
const payload = { ...baseline, product: 'demo', originalSlug: 'index', expectedRevision: baseline.revision }

test('nested JSX, blank lines, expressions, and code fence metadata stay byte-for-byte intact', () => {
  const source = '\n## Heading\n\n<Tabs>\n  <Tab title="One">\n\n    ```python script.py\n    print("a")\n\n    print("b")\n    ```\n\n  </Tab>\n</Tabs>\n\n<Custom value={{ a: 1 }} />\n\n'
  const { blocks, error } = parseMdx(source)
  assert.equal(error, null); assert.equal(blocks.length, 3)
  let output = source
  for (const block of blocks) output = replaceBlock(output, block, block.source)
  assert.equal(output, source)
  assert.equal(moveBlock(moveBlock(source, blocks, 0, 1), parseMdx(moveBlock(source, blocks, 0, 1)).blocks, 1, -1), source)
})
test('every component insertion is valid MDX', () => { for (const item of componentCatalog) assert.equal(parseMdx(item.source).error, null, item.name) })
test('invalid MDX produces a recoverable diagnostic', () => { assert.match(parseMdx('<Tabs>\n').error, /closing|end|expected/i) })
test('targeted block edits do not rewrite neighboring MDX', () => { const source = '### Keep level\n\n```rust main.rs\nfn main() {}\n```\n\nFinal'; const blocks = parseMdx(source).blocks; assert.equal(replaceBlock(source, blocks[2], 'Changed'), source.replace('Final', 'Changed')) })
test('save preserves unknown frontmatter and exact body; stale saves are rejected', async () => {
  const body = '\n## Exact\n\n<Tip>\n\nKeep spacing.\n\n</Tip>\n\n'
  const result = await savePage({ ...payload, source: body })
  const stored = await readFile(path.join(fixture, 'content/demo/index.mdx'), 'utf8')
  assert.deepEqual(matter(stored).data.custom, { retained: true }); assert.equal(matter(stored).data.icon, 'rocket'); assert.equal(matter(stored).content, body)
  await assert.rejects(savePage({ ...payload, source: 'stale' }), /changed on disk/)
  payload.expectedRevision = result.revision
})
test('rename collision preserves original and destination', async () => {
  await writeFile(path.join(fixture, 'content/demo/occupied.mdx'), 'occupied')
  const before = await readFile(path.join(fixture, 'content/demo/index.mdx'), 'utf8')
  await assert.rejects(savePage({ ...payload, slug: 'occupied', fileName: 'occupied.mdx' }), /already exists/)
  assert.equal(await readFile(path.join(fixture, 'content/demo/index.mdx'), 'utf8'), before)
  assert.equal(await readFile(path.join(fixture, 'content/demo/occupied.mdx'), 'utf8'), 'occupied')
})
test('rename returns canonical filename and updates navigation', async () => {
  await savePage({ ...payload, slug: 'guides/hello', fileName: 'guides/hello.mdx', title: 'Renamed' })
  const config = JSON.parse(await readFile(path.join(fixture, 'content/demo/config.json'), 'utf8'))
  assert.equal(config.navigation[0].pages[0].slug, 'guides/hello'); assert.equal(config.navigation[0].pages[0].title, 'Renamed')
  await assert.rejects(readFile(path.join(fixture, 'content/demo/index.mdx')), { code: 'ENOENT' })
})
test('new-page collision, path traversal, malformed MDX, and symlink writes are blocked', async () => {
  const input = { product: 'demo', slug: 'new', title: 'New', description: '', source: 'Hello', draft: true, create: true }
  await savePage(input)
  await assert.rejects(savePage(input), /already exists/)
  await assert.rejects(savePage({ ...input, slug: '../outside' }))
  await assert.rejects(savePage({ ...input, slug: 'broken', source: '<Tabs>' }), /Fix the MDX/)
  await symlink(fixture, path.join(fixture, 'content/demo/linked'))
  await assert.rejects(savePage({ ...input, slug: 'linked/outside' }), /Symbolic links/)
})

test('navigation saves preserve product settings and reject stale tree edits', async () => {
  const tree = [{ id: 'tab', type: 'tab', title: 'Guides', icon: 'book', children: [{ id: 'guide-page', type: 'page', title: 'Renamed', slug: 'guides/hello', icon: 'file' }] }]
  await saveNavigation({ product: 'demo', tree })
  const stored = JSON.parse(await readFile(path.join(fixture, 'content/demo/config.json'), 'utf8'))
  assert.equal(stored.theme.accent, '#f0ac73')
  assert.deepEqual(stored.navigationTree, tree)
  await assert.rejects(saveNavigation({ product: 'demo', tree: [], expectedTree: null }), /changed on disk/)
  const created = await savePage({ product: 'demo', slug: 'inside-tab', title: 'Inside tab', description: '', source: 'Hello', draft: true, create: true, navigationParent: 'tab' })
  assert.equal(created.slug, 'inside-tab')
  const updated = JSON.parse(await readFile(path.join(fixture, 'content/demo/config.json'), 'utf8'))
  assert.equal(updated.navigationTree[0].children[1].slug, 'inside-tab')
})

test.after(async () => { process.chdir(project); await rm(compiled, { recursive: true, force: true }); await rm(fixture, { recursive: true, force: true }) })

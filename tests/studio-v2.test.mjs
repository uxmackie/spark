import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
const compiled = await mkdtemp(path.join(process.cwd(), '.editor-test-'))
for (const file of ['fa-icons', 'inline-mdx', 'headings', 'icon-catalog', 'navigation', 'raw-mdx', 'mdx-editor', 'product-config', 'rich-text']) {
  const source = (await readFile(`lib/${file}.ts`, 'utf8')).replaceAll(/'@\/lib\/([^']+)'/g, "'./$1.mjs'")
  await writeFile(path.join(compiled, `${file}.mjs`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText)
}
const nav = await import(path.join(compiled, 'navigation.mjs'))
const mdx = await import(path.join(compiled, 'mdx-editor.mjs'))
const raw = await import(path.join(compiled, 'raw-mdx.mjs'))
const config = await import(path.join(compiled, 'product-config.mjs'))
const rich = await import(path.join(compiled, 'rich-text.mjs'))
const page = (id, slug = id) => ({ id, type: 'page', title: id, slug, icon: 'file' })
const tree = [{ id: 'home', type: 'tab', title: 'Home', icon: 'book', children: [{ id: 'group', type: 'group', title: 'Essentials', icon: 'folder', children: [page('intro'), page('guide')] }] }, { id: 'films', type: 'tab', title: 'Films', icon: 'film', children: [page('overview')] }]
test('move nested pages across tabs, before siblings, and back to root', () => {
  const moved = nav.moveNavigation(tree, 'guide', 'films', 'inside')
  assert.deepEqual(moved[1].children.map(n => n.id), ['overview', 'guide'])
  assert.deepEqual(moved[0].children[0].children.map(n => n.id), ['intro'])
  const ordered = nav.moveNavigation(moved, 'guide', 'overview', 'before')
  assert.deepEqual(ordered[1].children.map(n => n.id), ['guide', 'overview'])
  assert.equal(nav.moveNavigation(ordered, 'guide', null, 'inside').at(-1).id, 'guide')
  assert.equal(tree[0].children[0].children.length, 2, 'original tree is immutable')
})
test('cycles and invalid leaf drops are rejected without losing nodes', () => {
  assert.deepEqual(nav.moveNavigation(tree, 'home', 'group', 'inside'), tree)
  assert.deepEqual(nav.moveNavigation(tree, 'films', 'intro', 'inside'), tree)
  assert.deepEqual(nav.moveNavigation(tree, 'guide', 'missing', 'inside'), tree)
})
test('hidden containers hide descendants and rename preserves nested structure', () => {
  const hidden = nav.updateNavigation(tree, 'home', { hidden: true })
  assert.deepEqual(nav.flattenNavigation(hidden, true).map(n => n.id), ['films', 'overview'])
  const renamed = nav.renameNavigationPage(tree, 'intro', 'intro-new', 'Welcome')
  assert.equal(renamed[0].children[0].children[0].slug, 'intro-new')
  assert.equal(renamed[0].children[0].children[0].title, 'Welcome')
})
test('navigation accepts nested tabs and validates IDs and link destinations', () => {
  assert.equal(nav.navigationTreeSchema.safeParse(tree).success, true)
  assert.equal(nav.navigationTreeSchema.safeParse([...tree, tree[0]]).success, false)
  assert.equal(nav.navigationTreeSchema.safeParse([{ id: 'bad', type: 'anchor', title: 'Bad', icon: 'globe', href: 'javascript:alert(1)' }]).success, false)
})
test('raw document edits preserve all metadata and exact YAML when unchanged', () => {
  const text = '---\n# A comment\ntitle: Example\ndescription: Hello\ndraft: false\ncustom: [one, two]\n---\n\n# Heading\n'
  const parsed = raw.parseDocument(text)
  assert.deepEqual(parsed.frontmatter.custom, ['one', 'two'])
  assert.equal(raw.documentSource({ ...parsed, rawSource: text }), text)
  assert.match(raw.documentSource({ ...parsed, title: 'Changed', rawSource: text }), /title: Changed/)
  assert.throws(() => raw.parseDocument('---\ntitle: [\n---\nBody'))
})
test('block insertion and tidy remove only inter-block gaps, preserving code and JSX', () => {
  const body = 'One\n\n\n\n```python\na\n\n\nb\n```\n\n\n<Tip>\n\nHello\n\n</Tip>\n\n'
  const tidy = mdx.tidyBlockSpacing(body)
  assert.ok(tidy.includes('a\n\n\nb'))
  assert.ok(tidy.includes('<Tip>\n\nHello\n\n</Tip>'))
  assert.ok(!tidy.startsWith('One\n\n\n'))
  const inserted = mdx.insertBlock(tidy, '# Title', 1)
  assert.equal(mdx.parseMdx(inserted).blocks[1].node.depth, 1)
  assert.equal(mdx.parseMdx(mdx.reorderBlock(inserted, 1, 3)).blocks[3].source, '# Title')
})
test('inspiration settings differ by product and legacy products retain the default', () => {
  const a = config.parseProductConfig({ theme: { accent: '#35aacc', font: 'Inter', branding: 'one' }, inspiration: { enabled: false, icon: 'film', title: 'Films', description: 'Movie lore' } })
  const b = config.parseProductConfig({ inspiration: { enabled: true, icon: 'gamepad', title: 'Games', description: 'Play on' } })
  assert.equal(config.getInspiration(a).enabled, false)
  assert.equal(config.getInspiration(b).icon, 'gamepad')
  assert.equal(config.getThemeVariables(a)['--primary'], '#35aacc')
  assert.equal(config.getInspiration(config.parseProductConfig({})).title, 'A spark of inspiration')
})
// Small DOM fixtures test the serializer without launching a browser.
const text = value => ({ nodeType: 3, textContent: value })
function element(tag, children, attrs = {}) { return { nodeType: 1, tagName: tag.toUpperCase(), childNodes: children, textContent: children.map(n => n.textContent).join(''), dataset: {}, title: attrs.title ?? '', getAttribute: name => attrs[name] } }
test('rich formatting serializes valid Markdown, links, underline, and embedded MDX', () => {
  const root = element('div', [text('Hello '), element('strong', [text('bold ')]), element('em', [text('italic')]), text(' '), element('u', [text('underlined')]), text(' '), element('a', [text('guide')], { href: '/docs/guide' })])
  const output = rich.domToMarkdown(root)
  assert.equal(output, 'Hello **bold** *italic* <u>underlined</u> [guide](/docs/guide)')
  assert.equal(mdx.parseMdx(output).error, null)
  const protectedNode = { ...element('span', []), dataset: { mdxRaw: '<Icon icon="star" />' } }
  assert.equal(rich.domToMarkdown(element('div', [protectedNode])), '<Icon icon="star" />')
})
test.after(() => rm(compiled, { recursive: true, force: true }))

test('heading hierarchy, rich text and repeated titles share unique anchors; code is excluded', async () => {
  const headings = await import(path.join(compiled, 'headings.mjs'))
  const source = '# What **happens**\n\n## Becoming Spider-Man\n\n### The burglar\n\n# What happens\n\n# What happens-1\n\n```md\n# Not a heading\n```'
  const list = headings.collectHeadings(source)
  assert.deepEqual(list.map(h => h.depth), [1, 2, 3, 1, 1])
  assert.deepEqual(list.map(h => h.id), ['what-happens', 'becoming-spider-man', 'the-burglar', 'what-happens-1', 'what-happens-1-1'])
  const tree = { children: mdx.parseMdx(source).blocks.map(b => b.node) }
  headings.headingAnchors()(tree)
  assert.deepEqual(tree.children.filter(n => n.type === 'heading').map(n => n.data.hProperties.id), list.map(h => h.id))
})
test('tooltip fields preserve quotes, braces and newlines; icons render without losing their MDX', async () => {
  const { tooltipMarkup } = await import(path.join(compiled, 'inline-mdx.mjs'))
  const value = tooltipMarkup('**API**', { tip: 'A "quoted" {definition}\nSecond line', headline: 'API', href: '/docs/demo/index', cta: 'Read more' })
  assert.equal(mdx.parseMdx(value).error, null)
  const jsx = mdx.parseMdx(value).blocks[0].node.children[0]
  assert.equal(jsx.attributes.find(a => a.name === 'tip').value.data.estree.body[0].expression.value, 'A "quoted" {definition}\nSecond line')
  const source = 'Hello <Icon icon="star" /> and <Emoji icon="face-smile" />!'
  const html = rich.inlineHtml(mdx.parseMdx(source).blocks[0].node.children, source)
  assert.equal((html.match(/<svg/g) ?? []).length, 2)
  assert.match(html, /data-mdx-raw=/)
})
test('multiline paste inserts once and commits once even when input and blur follow', async () => {
  // Exercise the production handler with DOM and hook fixtures, without a browser.
  await writeFile(path.join(compiled, 'react-fixture.mjs'), `export const useRef = value => ({current:value}); export const useLayoutEffect = () => {}; export const createElement = (tag, props) => ({tag, props});`)
  const source = (await readFile('components/builder/editable-text.tsx', 'utf8')).replace("from 'react'", "from './react-fixture.mjs'").replace("'@/lib/rich-text'", "'./rich-text.mjs'")
  await writeFile(path.join(compiled, 'editable-text.mjs'), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText)
  const { EditableText } = await import(path.join(compiled, 'editable-text.mjs'))
  const commits = []
  const { props } = EditableText({ html: '', label: 'Test', onChange: value => commits.push(value) })
  const root = element('p', []); root.contains = () => true; props.ref.current = root
  let inserts = 0, prevented = 0, stopped = 0
  const range = { startContainer: root, endContainer: root, deleteContents() {}, insertNode(fragment) { inserts++; root.childNodes.push(...fragment.childNodes) }, setStartAfter() {}, collapse() {} }
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  globalThis.window = { getSelection: () => ({ rangeCount: 1, getRangeAt: () => range, removeAllRanges() {}, addRange() {} }) }
  globalThis.document = { createElement: tag => element(tag, []), createTextNode: text, createDocumentFragment: () => ({ childNodes: [], append(node) { this.childNodes.push(node) }, get lastChild() { return this.childNodes.at(-1) } }) }
  try {
    props.onPaste({ preventDefault() { prevented++ }, stopPropagation() { stopped++ }, clipboardData: { getData: type => { assert.equal(type, 'text/plain'); return 'First\r\n\r\n# Literal heading\n<script>alert(1)</script>' } } })
    props.onInput({ stopPropagation() {} }); props.onBlur()
    assert.equal(inserts, 1); assert.equal(prevented, 1); assert.equal(stopped, 1); assert.equal(commits.length, 1)
    assert.equal((commits[0].match(/First/g) ?? []).length, 1)
    assert.equal(mdx.parseMdx(commits[0]).error, null)
    assert.equal(mdx.parseMdx(commits[0]).blocks.length, 1, 'pasted blank lines do not remount or duplicate blocks')
    assert.ok(!commits[0].includes('<script>'))
  } finally { globalThis.window = oldWindow; globalThis.document = oldDocument }
})

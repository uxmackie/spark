# Spark Studio — direct editing, tooltips and section links

## Apply to an existing Spark project

1. Stop the development server.
2. Back up your project, then copy `app/`, `components/`, `lib/`, `tests/`, `package.json`, and `pnpm-lock.yaml` from this archive into it.
3. Keep your existing `content/` folder. Your product configurations and MDX files do not need to be replaced. The application reads the older group/page navigation format until you edit navigation.
4. Run `pnpm install --frozen-lockfile`.
5. Run `pnpm dev --hostname 127.0.0.1` and open http://127.0.0.1:3000/builder.

Use Node.js 22 or newer and pnpm. The builder writes to the local project and is disabled in production. Saving does not commit or deploy changes. Existing loopback/same-origin protections remain in place.

## Product message and appearance

Choose a product, open **Product settings**, and find **Inspiration message**. You can toggle it, choose a Font Awesome icon, and edit its title and description. This controls the panel below the table of contents in `components/docs/document.tsx`, not the motto at the bottom of the left navigation. The old left-sidebar motto remains under More options.

Each product stores its own settings. Products without message settings retain the original default. Turning the message off preserves the text and icon for later. The product's configured accent color now applies in both dark and light themes.

## Visual editing

Click directly in paragraphs and headings to edit. Pasted content is inserted once as plain text (including line breaks); pasted HTML does not execute. Each editable region owns its DOM children, and repeated input/blur notifications do not commit the same value twice. Select text for Bold, Italic, Underline, Strikethrough, Inline code, Link, and block-style controls. Enter adds a line break; use the block plus to add another paragraph.

The floating toolbar's **＋** opens inline tools: add a tooltip, a Font Awesome emoji-style face/reaction, or search the full supported icon catalog. The **Link** button opens a page search and link-text form. Picking a page inserts `/docs/product/page`, so links do not depend on the site's domain; full web URLs and `#section` links also work. The page search lists the currently selected product's pages.

The **pen icon** still opens the raw block editor for component properties, code and custom MDX. Its textarea includes inline tooltip and icon controls; choose **Apply changes** to commit those edits.

Each top-level block has two controls on its left:

- A six-dot handle: drag to reorder, or click for Duplicate, Delete, Move up/down, and Component properties / MDX.
- A plus: insert a component immediately below that block. Heading opens a secondary menu with Heading 1, 2, and 3.

The same insertion menu is available at the top and bottom of the page. Code language and filename metadata are retained. Card/step/accordion titles, tab labels and frame captions also support direct editing. Other component properties and unknown JSX remain editable through the pen button, Component properties / MDX, or Source mode. Existing empty-paragraph markers are preserved.

Unregistered components and dynamic expressions remain intact but do not execute in the editor. Touch and keyboard users can use Move up/down menus; native drag-and-drop targets desktop browsers.

## Raw source

Source mode displays the full `.mdx` document, including YAML frontmatter, with no split preview. Preview remains a separate mode. Invalid frontmatter and MDX produce a diagnostic and cannot be saved. Unknown frontmatter fields are retained; raw YAML comments and layout are retained when the raw file matches the current page model.

New block insertions use a single blank line between blocks. **Tidy block spacing** removes excess whitespace between top-level blocks only. It does not collapse blank lines inside code fences, nested components, or paragraph content. This operation participates in page undo history.

## Navigation

The Navigation heading reveals a plus button on hover/focus. Add a page, existing page, group, tab, dropdown, anchor, language, version, menu item, or product. Tabs organize published documentation into sections. Groups and the other container types can contain nested pages and groups; language/version containers organize content but do not generate translations or version snapshots.

Drag rows to reorder or move them into containers. A line indicates before/after; an outline indicates inside a container. The row's ellipsis menu also provides Move to, Move up/down, settings/rename, container conversion, and visibility controls. These are keyboard-accessible alternatives to dragging. A move that would create a cycle is rejected.

Navigation changes save immediately for the selected product. Page edits still use Save page. Removing a navigation item or using Remove from publishing hides it from published navigation; it does not delete the MDX file or create an access-control boundary around its direct URL. Unlisted files remain available in the builder. Creating a page from a group's menu places it there when the page is saved.

The new `navigationTree` property is optional. Existing `navigation` remains supported and is retained in configuration for compatibility. Page renames update matching references throughout the nested tree. Navigation saves compare the existing tree to detect stale changes, while preserving other product settings on disk.

## Saving and recovery

Saves retain unknown frontmatter, check page revisions, reject filename collisions, and write complete temporary files before replacing originals. Page paths and filenames remain linked. Local recovery copies are best-effort browser storage, not server saves. Undo history is per page session. Invalid raw text can be recovered; review it before saving. Provisional edits in the component-properties dialog must be applied.

Writes are serialized within one Node process. Individual file replacement is atomic, but page and configuration files are not a cross-file database transaction. Use one local editing process and source control for recovery. Draft is a metadata label and does not itself hide documentation pages.

## Verification

```sh
node --test tests/*.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

Regression tests cover nested MDX and expression preservation, insertion templates, raw frontmatter, stale saves, rename collisions, file-path protections, per-product settings, nested navigation movement/cycles, hidden ancestors, navigation persistence, rich-text serialization, and code-preserving spacing cleanup. Browser interaction/visual QA was not performed. The paste regression exercises the production handler with DOM fixtures; it does not replace live browser testing.

References: supplied Mintlify screenshots; https://www.mintlify.com/docs/components ; Font Awesome Next.js setup at https://docs.fontawesome.com/web/use-with/react/use-with ; browser editing behavior at https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand . Font Awesome is installed locally; no Kit or CDN is needed.

## Tooltips, icons and section links

Tooltips support `tip`, optional `headline`, and optional `cta`/`href`. Hover or click/tap the underlined text; keyboard users can focus the trigger and press Enter/Space. Escape dismisses the popup. A CTA can receive keyboard focus.

```mdx
Read about the <Tooltip headline="API" tip="How applications communicate" cta="Read the guide" href="/docs/spark/quickstart">API</Tooltip>.

Made with <Icon icon="heart" label="love" />. Hello <Emoji icon="face-smile" />!
```

Icons use the installed Font Awesome Free Solid collection subset listed in `lib/icon-catalog.ts` (48 supported icons, including 12 faces/reactions). They inherit text color and size, and are SVG symbols rather than colored Unicode emoji. Both `<Icon>` and `<Emoji>` are available in published MDX and preview. Inline components are protected chips during direct editing; use the pen or Source to change an existing chip's properties.

The right sidebar includes H1–H6 with indentation by level. Click an entry or a heading to jump to its anchor; hover/focus a heading and use the copy button for its full URL. Formatted and repeated headings get matching, unique IDs, and headings inside code blocks are ignored.

This update adds no dependencies. When upgrading from the immediately previous version, copy `app/`, `components/`, `lib/`, and optionally `tests/` and this README; keep your `content/`. Optionally update only `content/config.schema.json` to include the new face icons in JSON editor suggestions.

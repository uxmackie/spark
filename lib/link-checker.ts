import { parseMdx, type MdxNode } from '@/lib/mdx-editor'
import { collectHeadings } from '@/lib/headings'
export type LinkPage = { product:string; slug:string; title:string; source:string; draft:boolean }
export type LinkIssue = { href:string; reason:string; start:number; end:number; replacementKind:'markdown'|'attribute'; line:number }
export function checkLinks(current: LinkPage, pages: LinkPage[], productRoots: Record<string,string | undefined> = {}) {
  const parsed = parseMdx(current.source)
  if (parsed.error) throw new Error(`Fix this page's MDX first: ${parsed.error}`)
  const issues: LinkIssue[] = []
  let checked = 0, skipped = 0
  function inspect(href:string,start:number,end:number,replacementKind:'markdown'|'attribute') {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) { skipped++; return }
    let url: URL
    try { url = new URL(href, `https://spark.invalid/docs/${current.product}/${current.slug}`) } catch { return }
    if (!url.pathname.startsWith('/docs/')) { skipped++; return }
    checked++
    let parts:string[], hash:string
    try { parts = decodeURIComponent(url.pathname).split('/').filter(Boolean); hash = decodeURIComponent(url.hash.slice(1)) } catch { issues.push({href,reason:'Invalid URL encoding',start,end,replacementKind,line:current.source.slice(0,start).split('\n').length}); return }
    const product = parts[1], slug = parts.slice(2).join('/') || productRoots[product] || 'index'
    const target = product===current.product && slug===current.slug ? current : pages.find(p=>p.product===product && p.slug===slug)
    const reason = !target ? 'Page does not exist' : target.draft ? 'Destination is an unpublished draft' : hash && !collectHeadings(target.source).some(h=>h.id===hash) ? 'Heading does not exist' : ''
    if (reason) issues.push({href,reason,start,end,replacementKind,line:current.source.slice(0,start).split('\n').length})
  }
  const visit = (node: MdxNode) => {
    if ((node.type==='link' || node.type==='definition') && node.url && node.position) {
      const raw = current.source.slice(node.position.start.offset,node.position.end.offset)
      // Restrict replacement to the destination, preserving label/title and surrounding MDX.
      const offset = raw.indexOf(node.url, node.type==='link' ? Math.max(0,raw.indexOf('](')+2) : Math.max(0,raw.indexOf(']:')+2))
      if (offset>=0) inspect(node.url,node.position.start.offset+offset,node.position.start.offset+offset+node.url.length,'markdown')
      else skipped++
    }
    for (const attr of node.attributes ?? []) if (attr.name==='href' && attr.position) {
      let href = typeof attr.value==='string' ? attr.value : undefined
      if (href===undefined) {
        const expression = (attr.value as {data?:{estree?:{body?:{expression?:{type?:string;value?:unknown}}[]}}})?.data?.estree?.body?.[0]?.expression
        if (expression?.type==='Literal' && typeof expression.value==='string') href=expression.value
      }
      if (href===undefined) skipped++
      else inspect(href,attr.position.start.offset,attr.position.end.offset,'attribute')
    }
    node.children?.forEach(visit)
  }
  parsed.blocks.forEach(b=>visit(b.node))
  return {issues,checked,skipped}
}
export function repairLink(source:string, issue:LinkIssue, href:string) {
  if (!/^(?:\/(?!\/)|#|\.\.?\/)/.test(href) || /[\s<>"\\]/.test(href)) throw new Error('Choose a docs path, relative path, or heading anchor without spaces.')
  const value = issue.replacementKind==='attribute' ? `href={${JSON.stringify(href)}}` : href.replaceAll('(', '%28').replaceAll(')', '%29')
  return source.slice(0,issue.start)+value+source.slice(issue.end)
}

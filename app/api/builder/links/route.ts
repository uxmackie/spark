import { assertBuilderAccess } from '@/lib/builder-access'
import { getProducts } from '@/lib/content'
import { readBuilderProduct } from '@/lib/builder'
import { checkLinks } from '@/lib/link-checker'
import { collectHeadings } from '@/lib/headings'
import { flattenNavigation } from '@/lib/navigation'
import { z } from 'zod'
import { slugSchema } from '@/lib/product-config'
export async function POST(request: Request) {
  try {
    assertBuilderAccess(request)
    const current = z.object({product:slugSchema,slug:z.string().regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/),title:z.string(),source:z.string().max(2_000_000),draft:z.boolean()}).parse(await request.json())
    const products = await getProducts({includeDrafts:true})
    const pages = (await Promise.all(products.map(async p=>(await readBuilderProduct(p.slug)).pages.map(page=>({...page,product:p.slug}))))).flat()
    const publishedProducts = await getProducts()
    const targets = pages.filter(p=>p.product!==current.product || p.slug!==current.slug).concat(current as typeof pages[number])
    return Response.json({...checkLinks(current,targets,Object.fromEntries(publishedProducts.map(p=>[p.slug,p.config.navigationTree ? flattenNavigation(p.config.navigationTree,true).find(n=>n.type==='page')?.slug : p.config.navigation[0]?.pages[0]?.slug]))),targets:targets.map(p=>({title:p.title,href:`/docs/${p.product}/${p.slug}`,draft:p.draft,headings:collectHeadings(p.source)}))})
  } catch(error) { return Response.json({error:(error as Error).message},{status:400}) }
}

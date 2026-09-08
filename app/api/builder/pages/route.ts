import { assertBuilderAccess } from '@/lib/builder-access'
import { NextResponse } from 'next/server'
import { savePage, readBuilderProduct } from '@/lib/builder'

export async function GET(request: Request) {
  try { assertBuilderAccess(request) } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 403 }) }
  const product = new URL(request.url).searchParams.get('product')
  if (!product) return NextResponse.json({ error: 'Product is required' }, { status: 400 })
  try { return NextResponse.json(await readBuilderProduct(product)) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load pages' }, { status: 404 }) }
}
export async function POST(request: Request) {
  try { assertBuilderAccess(request); return NextResponse.json(await savePage(await request.json()), { status: 201 }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save page' }, { status: 400 }) }
}

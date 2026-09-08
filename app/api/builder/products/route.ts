import { assertBuilderAccess } from '@/lib/builder-access'
import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/content'
import { saveProduct } from '@/lib/builder'

export async function GET(request: Request) { try { assertBuilderAccess(request); return NextResponse.json(await getProducts()) } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 403 }) } }
export async function POST(request: Request) {
  try { assertBuilderAccess(request); return NextResponse.json(await saveProduct(await request.json()), { status: 201 }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save product' }, { status: 400 }) }
}

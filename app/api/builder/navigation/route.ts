import { NextResponse } from 'next/server'
import { assertBuilderAccess } from '@/lib/builder-access'
import { saveNavigation } from '@/lib/builder'
export async function POST(request: Request) {
  try { assertBuilderAccess(request); return NextResponse.json(await saveNavigation(await request.json())) }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }) }
}

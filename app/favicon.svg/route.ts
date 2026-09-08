import { sparkSvg } from '@/lib/spark-logo'
export function GET(request: Request) {
  const color = new URL(request.url).searchParams.get('accent')
  return new Response(sparkSvg(color, true), { headers: {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  } })
}

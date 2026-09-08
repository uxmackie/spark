import 'server-only'

// This filesystem editor is local development tooling, not a public CMS.
export function assertBuilderAccess(request?: Request) {
  if (process.env.NODE_ENV !== 'development') throw new Error('The builder is available in local development only')
  if (!request) return

  // Next can reconstruct request.url using its listening address instead of the
  // hostname the browser used. Host preserves the browser-facing authority.
  // Do not use forwarded headers or treat different loopback origins as equal.
  const internalUrl = new URL(request.url)
  const host = request.headers.get('host') ?? internalUrl.host
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(host)) {
    throw new Error('The builder requires a loopback host')
  }
  const browserUrl = new URL(`${internalUrl.protocol}//${host}`)
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new Error('Cross-site builder access is not allowed')
  }
  if (request.method !== 'GET' && request.headers.get('origin') !== browserUrl.origin) {
    throw new Error('A same-origin editor request is required')
  }
}

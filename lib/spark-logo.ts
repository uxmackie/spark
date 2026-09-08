export const sparkAccent = '#f0ac73'
export function normalizeAccent(color: unknown) {
  return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : sparkAccent
}
export function sparkSvg(color: unknown = sparkAccent, favicon = false) {
  const accent = normalizeAccent(color)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" role="img" aria-label="Spark"><title>Spark</title>${favicon ? '<rect width="100" height="100" rx="24" fill="#171917"/>' : ''}<g stroke="${accent}" stroke-width="12" stroke-linecap="round"${favicon ? ' transform="translate(10 10) scale(.8)"' : ''}><path d="M50 14v72M18.823 32l62.354 36M18.823 68l62.354-36"/></g></svg>`
}
export function sparkIcons(accent: unknown = sparkAccent) {
  return { icon: [{ url: `/favicon.svg?accent=${encodeURIComponent(normalizeAccent(accent))}`, type: 'image/svg+xml', sizes: 'any' }] }
}

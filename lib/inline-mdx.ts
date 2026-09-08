// Quote attributes as JSX string literals, preserving quotes, braces and newlines.
export function tooltipMarkup(text: string, fields: { tip: string; headline?: string; cta?: string; href?: string }) {
  const attrs = Object.entries(fields).filter(([, value]) => value?.trim()).map(([key, value]) => `${key}={${JSON.stringify(value)}}`).join(' ')
  return `<Tooltip ${attrs}>${text}</Tooltip>`
}

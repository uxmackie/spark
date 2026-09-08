// Quote attributes as JSX string literals, preserving quotes, braces and newlines.
export function tooltipMarkup(text: string, fields: { tip: string; headline?: string; cta?: string; href?: string }) {
  const attrs = Object.entries(fields).filter(([, value]) => value?.trim()).map(([key, value]) => `${key}={${JSON.stringify(value)}}`).join(' ')
  return `<Tooltip ${attrs}>${text}</Tooltip>`
}

export function iconMdx(name: string, tip = '', emoji = false) {
  return `<${emoji ? 'Emoji' : 'Icon'} icon={${JSON.stringify(name)}}${tip.trim() ? ` tip={${JSON.stringify(tip)}}` : ''} />`
}

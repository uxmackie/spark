import { z } from 'zod'
import { navigationTreeSchema } from '@/lib/navigation'
import { normalizeIconName, isIconName } from '@/lib/icon-catalog'
import type { CSSProperties } from 'react'

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const pagePath = z.string().regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/)
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const icon = z.string().transform(normalizeIconName).refine(isIconName, 'Unknown Font Awesome Free Solid or Brands icon')

export const productConfigSchema = z.object({
  name: z.string().min(1).max(60).catch('Spark Docs'),
  description: z.string().max(200).catch('A home for your knowledge.'),
  motto: z.string().max(160).catch('All ideas start from a spark.'),
  version: z.string().min(1).max(30).catch('v1.0'),
  icon: icon.catch('book'),
  theme: z.object({
    accent: color.catch('#f0ac73'),
    font: z.enum(['Inter', 'Arial', 'Georgia']).catch('Inter'),
    branding: z.string().min(1).max(40).catch('spark'),
  }).catch(() => ({ accent: '#f0ac73', font: 'Inter' as const, branding: 'spark' })),
  inspiration: z.object({ enabled: z.boolean(), icon, title: z.string().max(100), description: z.string().max(500) }).optional(),
  navigationTree: navigationTreeSchema.optional(),
  navigation: z.array(z.object({
    group: z.string().min(1).max(60),
    pages: z.array(z.object({ slug: pagePath, title: z.string().min(1).max(100), icon: icon.catch('file') })),
  })).catch(() => []),
})

export type ProductConfig = z.infer<typeof productConfigSchema>
export type Product = { slug: string; config: ProductConfig }
export type PageInfo = { slug: string; title: string; description: string; product: string }
export const siteDefaults = productConfigSchema.parse({})

export function parseProductConfig(input: unknown): ProductConfig {
  const result = productConfigSchema.safeParse(input)
  return result.success ? result.data : productConfigSchema.parse({})
}

export function getThemeVariables(config: ProductConfig): CSSProperties {
  return {
    '--primary': config.theme.accent,
    '--ring': 'var(--primary)',
    '--accent': 'color-mix(in srgb, var(--primary) 10%, var(--background))',
    '--accent-foreground': 'var(--primary)',
    '--border': 'color-mix(in srgb, var(--foreground) 10%, transparent)',
    '--input': 'var(--border)',
    '--card-foreground': 'var(--foreground)',
    '--popover-foreground': 'var(--foreground)',
    '--secondary-foreground': 'var(--foreground)',
    '--product-font': config.theme.font === 'Inter' ? 'var(--font-inter)' : config.theme.font,
  } as CSSProperties
}

export function pageHref(product: string, slug = 'index') {
  return `/docs/${product}/${slug}`
}

export function headingId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export function getInspiration(config: ProductConfig) {
  return config.inspiration ?? { enabled: true, icon: 'lightbulb' as const, title: 'A spark of inspiration', description: 'Big ideas start small.\nYour first page is a great place to begin.' }
}

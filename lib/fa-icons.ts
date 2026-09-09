import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { icon, config, type IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { normalizeIconName } from '@/lib/icon-catalog'
config.autoAddCss = false
export const icons: Record<string, IconDefinition> = Object.create(null)
for (const definition of [...Object.values(fab), ...Object.values(fas)]) {
  icons[definition.iconName] = definition
  for (const alias of definition.icon[2]) if (typeof alias === 'string') icons[alias] = definition
}
for (const definition of Object.values(fab)) {
  for (const name of [definition.iconName, ...definition.icon[2].filter((alias): alias is string => typeof alias === 'string')]) {
    if (icons[name]?.prefix !== 'fab') icons[`brands:${name}`] = definition
  }
}
// Preserve the appearance of names used by existing Spark products.
Object.assign(icons, { book: fas.faBookOpen, file: fas.faFileLines, layers: fas.faLayerGroup, folder: fas.faFolderOpen, settings: fas.faGear, shield: fas.faShieldHalved })
export function resolveIcon(name = 'file') { return icons[normalizeIconName(name)] ?? icons.file }
export function iconMarkup(name: string) { return icon(resolveIcon(name)).html.join('') }

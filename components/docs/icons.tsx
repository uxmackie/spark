'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '@/lib/fa-icons'
import type { ProductIconName } from '@/lib/icon-catalog'
export function ProductIcon({ name, className = 'size-4' }: { name?: string; className?: string }) {
  return <FontAwesomeIcon icon={icons[name as ProductIconName] ?? icons.file} className={className} aria-hidden="true" />
}

'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { resolveIcon } from '@/lib/fa-icons'
export function ProductIcon({ name, className = 'size-4' }: { name?: string; className?: string }) {
  return <FontAwesomeIcon icon={resolveIcon(name)} className={className} aria-hidden="true" />
}

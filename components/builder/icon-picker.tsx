'use client'
import { useState } from 'react'
import { ProductIcon } from '@/components/docs/icons'
import { iconLabel, isIconName, normalizeIconName, searchIcons, type ProductIconName } from '@/lib/icon-catalog'

export function IconPicker({ value, onChange }: { value: string; onChange: (value: ProductIconName) => void }) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(60)
  const matches = searchIcons(query)
  const exact = query.trim() && isIconName(query) ? normalizeIconName(query) : null
  return <div className="studio-icon-picker"><div className="studio-icon-picker-heading"><span>Icon</span>{value && <span><ProductIcon name={value} />{iconLabel(value)}</span>}</div><input type="search" aria-label="Search Font Awesome icons" placeholder="Type a name, e.g. dragon or fa-solid fa-dragon" value={query} onChange={event => { setQuery(event.target.value); setLimit(60) }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (exact) onChange(exact) } }} />{exact && <button type="button" className="studio-use-icon" onClick={() => onChange(exact)}><ProductIcon name={exact} /> Use {exact}</button>}<div className="studio-icon-grid" role="group" aria-label="Font Awesome icons">{matches.slice(0, limit).map(name => <button key={name} type="button" aria-pressed={name === normalizeIconName(value)} aria-label={iconLabel(name)} title={name} onClick={() => onChange(name)}><ProductIcon name={name} className="size-5" /><span>{iconLabel(name)}</span></button>)}</div>{matches.length > limit && <button type="button" className="studio-use-icon" onClick={() => setLimit(count => count + 60)}>Show more ({matches.length - limit} remaining)</button>}{!matches.length && <p role="status">No matching Free Solid icon. Check the name or try another search.</p>}<small>Font Awesome · Full installed Free Solid collection · {matches.length} matching names</small></div>
}

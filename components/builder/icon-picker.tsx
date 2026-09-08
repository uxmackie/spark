'use client'
import { useState } from 'react'
import { ProductIcon } from '@/components/docs/icons'
import { iconNames, iconLabel, type ProductIconName } from '@/lib/icon-catalog'

export function IconPicker({ value, onChange }: { value: string; onChange: (value: ProductIconName) => void }) {
  const [query, setQuery] = useState('')
  const matches = iconNames.filter(name => iconLabel(name).toLowerCase().includes(query.toLowerCase().trim()))
  return <div className="studio-icon-picker"><div className="studio-icon-picker-heading"><span>Icon</span><span><ProductIcon name={value} />{iconLabel(value)}</span></div><input type="search" aria-label="Search Font Awesome icons" placeholder="Search Font Awesome icons…" value={query} onChange={event => setQuery(event.target.value)} /><div className="studio-icon-grid" role="group" aria-label="Font Awesome icons">{matches.map(name => <button key={name} type="button" aria-pressed={name === value} aria-label={iconLabel(name)} title={iconLabel(name)} onClick={() => onChange(name)}><ProductIcon name={name} className="size-5" /><span>{iconLabel(name)}</span></button>)}</div>{!matches.length && <p role="status">No matching icons. Try another name.</p>}<small>Font Awesome · Free Solid</small></div>
}

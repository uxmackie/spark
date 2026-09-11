'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { componentCatalog } from '@/lib/mdx-editor'
const catalog = [...componentCatalog, { name: 'Icon', category: 'Writing', description: 'An inline Font Awesome icon.', source: '<Icon icon="star" />' }]
export const slashCommands = catalog.flatMap(item => item.name === 'Heading' ? [1, 2, 3].map(level => ({ ...item, name: `Heading ${level}`, source: `${'#'.repeat(level)} Heading ${level}` })) : [item])
export function SlashMenu({ query, active, rect, id, onHover, onChoose }: { query: string; active: number; rect: {left:number;bottom:number;top:number}; id:string; onHover:(index:number)=>void; onChoose:(source:string)=>void }) {
  const items = slashCommands.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }) }, [active])
  const selected = items[active]
  const top = rect.bottom + 8 + 300 > window.innerHeight ? Math.max(12, rect.top - 308) : rect.bottom + 8
  return createPortal(<div className="studio-slash" style={{position:'fixed',left:Math.max(12,Math.min(rect.left,window.innerWidth-280)),top}} onMouseDown={e=>e.preventDefault()}>
    <div ref={ref} id={id} role="listbox" aria-label="Insert component" className="studio-slash-list">
      {items.map((item,index)=><div key={item.name}>{(index===0 || item.category!==items[index-1].category) && <div className="studio-slash-category">{item.category}</div>}<button type="button" id={`${id}-${index}`} role="option" aria-selected={index===active} onMouseEnter={()=>onHover(index)} onClick={()=>onChoose(item.source)}><span className="studio-slash-symbol">{item.name.startsWith('Heading') ? `H${item.name.slice(-1)}` : item.name==='Code' ? '</>' : item.name==='Paragraph' ? '¶' : '+'}</span><span>{item.name}</span>{index===active && <kbd>↵</kbd>}</button></div>)}
      {!items.length && <p>No matching components</p>}
    </div>
    {selected && rect.left + 500 < window.innerWidth && <aside className="studio-slash-preview"><pre>{selected.source}</pre><strong>{selected.name}</strong><p>{selected.description}</p></aside>}
  </div>,document.body)
}

'use client'
import { emojiNames, iconLabel } from '@/lib/icon-catalog'
import { ProductIcon } from '@/components/docs/icons'
import { componentCatalog } from '@/lib/mdx-editor'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu'
import { Plus } from '@/components/icons/font-awesome'
export function ComponentMenu({ onInsert, disabled = false, label = 'Add component below' }: { onInsert: (source: string) => void; disabled?: boolean; label?: string }) {
  return <DropdownMenu><DropdownMenuTrigger disabled={disabled} aria-label={label} title={label} className="studio-block-plus"><Plus size={13} /></DropdownMenuTrigger><DropdownMenuContent className="studio-context-menu studio-insert-menu" side="right">{componentCatalog.map(item => item.name === 'Emoji' ? <DropdownMenuSub key={item.name}><DropdownMenuSubTrigger>Emoji</DropdownMenuSubTrigger><DropdownMenuSubContent className="studio-context-menu">{emojiNames.map(icon => <DropdownMenuItem key={icon} onClick={() => onInsert(`<Emoji icon="${icon}" />`)}><ProductIcon name={icon} />{iconLabel(icon)}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuSub> : item.name === 'Heading' ? <DropdownMenuSub key={item.name}><DropdownMenuSubTrigger>Heading</DropdownMenuSubTrigger><DropdownMenuSubContent className="studio-context-menu">{[1, 2, 3].map(level => <DropdownMenuItem key={level} onClick={() => onInsert(`${'#'.repeat(level)} Heading ${level}`)}>H{level} · Heading {level}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuSub> : <DropdownMenuItem key={item.name} onClick={() => onInsert(item.source)}>{item.name}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
}

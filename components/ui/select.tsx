'use client'

import { Select } from '@base-ui/react/select'
import { Check, ChevronDown } from '@/components/icons/font-awesome'

export function StyledSelect({ value, onValueChange, options, label, disabled = false, studio = false }: {
  value: string; onValueChange: (value: string) => void
  options: { value: string; label: string }[]; label: string; disabled?: boolean; studio?: boolean
}) {
  return <Select.Root value={value} onValueChange={next => { if (next !== null) onValueChange(next) }} items={options} disabled={disabled}>
    <Select.Trigger type="button" aria-label={label} className={`spark-select-trigger ${studio ? 'spark-select-studio' : ''}`}>
      <Select.Value /><Select.Icon><ChevronDown size={12} /></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Positioner sideOffset={6} align="start" alignItemWithTrigger={false} className="spark-select-positioner">
      <Select.Popup className={`spark-select-popup ${studio ? 'spark-select-studio' : ''}`}>
        <Select.List>{options.map(option => <Select.Item key={option.value} value={option.value} className="spark-select-item">
          <Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Check size={12} /></Select.ItemIndicator>
        </Select.Item>)}</Select.List>
      </Select.Popup>
    </Select.Positioner></Select.Portal>
  </Select.Root>
}

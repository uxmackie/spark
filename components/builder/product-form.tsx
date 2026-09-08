'use client'

import { useState } from 'react'
import { IconPicker } from './icon-picker'
import { Save, Sparkles } from '@/components/icons/font-awesome'
import { getInspiration, type ProductConfig } from '@/lib/product-config'

type Props = {
  config: ProductConfig
  onChange: (config: ProductConfig) => void
  creating: boolean
  slug: string
  onSlugChange: (slug: string) => void
  busy: boolean
  onSave: () => void
}
const makeSlug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function ProductForm({ config, onChange, creating, slug, onSlugChange, busy, onSave }: Props) {
  const [customSlug, setCustomSlug] = useState(false)
  const message = getInspiration(config)
  const setMessage = (patch: Partial<typeof message>) => onChange({ ...config, inspiration: { ...message, ...patch } })
  const setTheme = (patch: Partial<ProductConfig['theme']>) => onChange({ ...config, theme: { ...config.theme, ...patch } })
  return <form className="studio-product-form" onSubmit={event => { event.preventDefault(); onSave() }}>
    <fieldset disabled={busy}>
      <label>Product name<input autoFocus required maxLength={60} placeholder="e.g. Chronoverse" value={config.name} onChange={event => { const name = event.target.value; onChange({ ...config, name }); if (creating && !customSlug) onSlugChange(makeSlug(name)) }} /></label>
      {creating && <label>Web address<div className="studio-address"><span>/docs/</span><input aria-label="Product web address" required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Use lowercase letters, numbers, and hyphens." placeholder="chronoverse" value={slug} onChange={event => { setCustomSlug(true); onSlugChange(event.target.value) }} /></div><small>Created from your name. You can customize it before saving.</small></label>}
      <label>Description<textarea rows={3} maxLength={200} placeholder="What will readers discover here?" value={config.description} onChange={event => onChange({ ...config, description: event.target.value })} /></label>
      <div className="studio-form-section"><span>Make it yours</span><p>A few small details to give your product its own feel.</p></div>
      <div className="studio-form-row">
        <label>Accent color<div className="studio-color-field"><input type="color" aria-label="Choose accent color" value={/^#[0-9a-f]{6}$/i.test(config.theme.accent) ? config.theme.accent : '#f0ac73'} onChange={event => setTheme({ accent: event.target.value })} /><input aria-label="Accent hex color" required pattern="#[0-9a-fA-F]{6}" title="Enter a six-digit hex color, such as #f0ac73." maxLength={7} value={config.theme.accent} onChange={event => setTheme({ accent: event.target.value })} /></div></label>
        <label>Font<select value={config.theme.font} onChange={event => setTheme({ font: event.target.value as ProductConfig['theme']['font'] })}>{['Inter', 'Arial', 'Georgia'].map(font => <option key={font}>{font}</option>)}</select></label>
      </div>
      <IconPicker value={config.icon} onChange={icon => onChange({ ...config, icon })} />
      <section className="studio-sidebar-message-settings" aria-label="Inspiration message settings">
        <label className="studio-message-toggle"><span><strong>Inspiration message</strong><small>Show a message below the page’s table of contents.</small></span><input type="checkbox" role="switch" checked={message.enabled} onChange={event => setMessage({ enabled: event.target.checked })} /></label>
        {message.enabled && <div className="studio-message-fields">
          <IconPicker value={message.icon} onChange={icon => setMessage({ icon })} />
          <label>Message title<input maxLength={100} value={message.title} onChange={event => setMessage({ title: event.target.value })} /></label>
          <label>Description<textarea rows={3} maxLength={500} value={message.description} onChange={event => setMessage({ description: event.target.value })} /></label>
        </div>}
      </section>
      <details className="studio-product-more"><summary>More options</summary><div><label>Sidebar motto<input maxLength={160} value={config.motto} onChange={event => onChange({ ...config, motto: event.target.value })} /></label>
        <div className="studio-form-row"><label>Version<input required maxLength={30} placeholder="v1.0" value={config.version} onChange={event => onChange({ ...config, version: event.target.value })} /></label><label>Brand name<input required maxLength={40} placeholder="spark" value={config.theme.branding} onChange={event => setTheme({ branding: event.target.value })} /></label></div>
      </div></details>
      <div className="studio-product-submit"><button type="submit" className="studio-save">{creating ? <Sparkles size={15} /> : <Save size={15} />}{busy ? 'Saving…' : creating ? 'Create product' : 'Save changes'}</button></div>
    </fieldset>
  </form>
}

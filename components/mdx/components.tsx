'use client'

import { Popover } from '@base-ui/react/popover'
import { iconLabel } from '@/lib/icon-catalog'
import { ProductIcon } from '@/components/docs/icons'
import { Children, isValidElement, useId, useState, type ReactNode, type CSSProperties } from 'react'
import { Info as InfoIcon, Lightbulb, TriangleAlert, CircleCheck, OctagonAlert, ArrowUpRight, BookOpen, Rocket, Code2 } from '@/components/icons/font-awesome'

type Content = { children?: ReactNode }
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const url = value.trim()
  return /^(https?:|mailto:|tel:)/i.test(url) || (!/^[a-z][a-z\d+.-]*:/i.test(url) && !url.startsWith('//') && !/[\u0000-\u0020\\]/.test(url)) ? url : undefined
}
function Callout({ children, kind }: Content & { kind: string }) {
  const Icon = kind === 'Tip' ? Lightbulb : kind === 'Warning' ? TriangleAlert : kind === 'Danger' ? OctagonAlert : kind === 'Check' ? CircleCheck : InfoIcon
  return <aside className={`mdx-callout mdx-${kind.toLowerCase()}`}><Icon size={18} aria-label={kind} /><div>{children}</div></aside>
}
export const Note = (p: Content) => <Callout {...p} kind="Note" />
export const Info = (p: Content) => <Callout {...p} kind="Info" />
export const Tip = (p: Content) => <Callout {...p} kind="Tip" />
export const Warning = (p: Content) => <Callout {...p} kind="Warning" />
export const Check = (p: Content) => <Callout {...p} kind="Check" />
export const Danger = (p: Content) => <Callout {...p} kind="Danger" />
export function Card({ title, icon, href, img, children }: Content & { title?: ReactNode; icon?: string; href?: string; img?: string }) {
  const body = <>{safeUrl(img) && <img src={safeUrl(img)} alt="" className="mdx-card-image" />}<div className="mdx-card-top"><ProductIcon name={icon ?? 'book'} className="size-5" />{safeUrl(href) && <ArrowUpRight size={16} />}</div><strong>{title}</strong><div>{children}</div></>
  return safeUrl(href) ? <a href={safeUrl(href)} className="mdx-card doc-card">{body}</a> : <div className="mdx-card">{body}</div>
}
export function Columns({ children, cols = 2 }: Content & { cols?: number }) { return <div className="mdx-columns" style={{ '--cols': Math.max(1, Math.min(4, Number(cols) || 2)) } as CSSProperties}>{children}</div> }
export const CardGroup = Columns
export function Tab({ children }: Content & { title?: ReactNode }) { return <>{children}</> }
export function Tabs({ children }: Content) {
  const items = Children.toArray(children).filter(isValidElement<{ title?: ReactNode; children?: ReactNode }>)
  const [active, setActive] = useState(0)
  const id = useId()
  const selected = Math.min(active, Math.max(0, items.length - 1))
  return <div className="mdx-tabs"><div role="tablist" aria-label="Content tabs">{items.map((item, i) => <button key={i} id={`${id}-tab-${i}`} role="tab" aria-selected={selected === i} aria-controls={`${id}-panel-${i}`} tabIndex={selected === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length; setActive(next); document.getElementById(`${id}-tab-${next}`)?.focus() }}>{item.props.title ?? `Tab ${i + 1}`}</button>)}</div>{items.map((item, i) => <div key={i} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={selected !== i} tabIndex={0}>{item.props.children}</div>)}</div>
}
export function Steps({ children }: Content) { return <div className="mdx-steps">{children}</div> }
export function Step({ title, children }: Content & { title?: ReactNode }) { return <section className="mdx-step"><strong>{title}</strong><div>{children}</div></section> }
export function Accordion({ title, children }: Content & { title?: ReactNode }) { return <details className="mdx-accordion"><summary>{title}</summary><div>{children}</div></details> }
export function AccordionGroup({ children }: Content) { return <div className="mdx-accordion-group">{children}</div> }
export function Frame({ caption, children }: Content & { caption?: ReactNode }) { return <figure className="mdx-frame">{children}{caption && <figcaption>{caption}</figcaption>}</figure> }
export function Badge({ children }: Content) { return <span className="mdx-badge">{children}</span> }
/** A hover explanation that also opens by keyboard or tap. A popover permits CTA links. */
export function Tooltip({ children, tip = "", headline, cta, href, triggerHref }: Content & { tip?: string; headline?: string; cta?: string; href?: string; triggerHref?: string }) {
  return <Popover.Root><Popover.Trigger render={safeUrl(triggerHref) ? <a href={safeUrl(triggerHref)} /> : undefined} nativeButton={!safeUrl(triggerHref)} onClick={event => { if (safeUrl(triggerHref)) event.preventBaseUIHandler() }} openOnHover delay={150} closeDelay={150} className={`mdx-tooltip-trigger${safeUrl(triggerHref) ? " mdx-icon-link" : ""}`}>{children}</Popover.Trigger><Popover.Portal><Popover.Positioner side="top" sideOffset={8} className="mdx-tooltip-positioner"><Popover.Popup className="mdx-tooltip-popup" initialFocus={false} aria-label={headline || 'More information'}>{headline && <Popover.Title className="mdx-tooltip-heading">{headline}</Popover.Title>}<Popover.Description className="mdx-tooltip-description">{tip}</Popover.Description>{cta && safeUrl(href) && <a className="mdx-tooltip-cta" href={safeUrl(href)}>{cta} ↗</a>}</Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>
}
export function Emoji({ icon = 'face-smile', label, tip, headline, cta, href }: Content & { icon?: string; label?: string; tip?: string; headline?: string; cta?: string; href?: string }) {
  const link = safeUrl(href)
  const highlighted = !!tip?.trim() || !!link
  const symbol = <span role="img" aria-label={label || iconLabel(icon)} className={`mdx-emoji${highlighted ? " mdx-icon-accent" : ""}`}><ProductIcon name={icon} className="mdx-emoji-icon" /></span>
  return tip?.trim() ? <Tooltip tip={tip} headline={headline} cta={cta} href={link} triggerHref={link}>{symbol}</Tooltip> : link ? <a className="mdx-icon-link" href={link}>{symbol}</a> : symbol
}
export const Icon = Emoji
export const mdxComponents = { Note, Info, Tip, Warning, Check, Danger, Card, CardGroup, Columns, Tabs, Tab, Steps, Step, Accordion, AccordionGroup, Frame, Badge, Tooltip, Emoji, Icon }

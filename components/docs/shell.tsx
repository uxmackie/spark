'use client'

import { useTheme } from './use-theme'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, Asterisk, Check, ChevronDown, ChevronRight, Lightbulb, Menu, Moon, Sun, X } from '@/components/icons/font-awesome'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PublishedNavigation, firstNavigationHref } from './navigation'
import { flattenNavigation } from '@/lib/navigation'
import { ProductIcon } from '@/components/docs/icons'
import { DocSearch } from '@/components/docs/search'
import { cn } from '@/lib/utils'
import { getThemeVariables, pageHref, type PageInfo, type Product } from '@/lib/product-config'

export function DocsShell({ products, activeProduct, pages, children }: { products: Product[]; activeProduct: Product; pages: PageInfo[]; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { light, toggleTheme } = useTheme()
  const [chosenTab, setChosenTab] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  useEffect(() => setChosenTab(null), [pathname])
  const { config } = activeProduct
  const theme = getThemeVariables(config)
  const currentSlug = pathname === '/' ? 'index' : pathname.split('/').slice(3).join('/') || 'index'
  const customTree = config.navigationTree
  const customTabs = customTree?.filter(node => node.type === 'tab' && !node.hidden) ?? []
  const currentTab = customTabs.find(tab => tab.id === chosenTab) ?? customTabs.find(tab => flattenNavigation(tab.children ?? [], true).some(node => node.slug === currentSlug)) ?? customTabs[0]
  const sidebarNodes = customTree ? [...customTree.filter(node => node.type !== 'tab'), ...(currentTab?.children ?? [])] : []
  const activeTab = currentSlug === 'changelog' ? 'changelog' : currentSlug === 'configuration' ? 'reference' : 'documentation'
  const hasPage = (slug: string) => pages.some(page => page.slug === slug)
  const referencePage = hasPage('configuration') ? 'configuration' : undefined
  const changelogPage = hasPage('changelog') ? 'changelog' : undefined
  const repositoryPage = hasPage('project-structure') ? 'project-structure' : undefined
  function closeMobile() { setMobileOpen(false) }

  return <div className="min-h-screen bg-background font-sans text-foreground" style={theme}>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:p-3 focus:text-primary-foreground">Skip to content</a>
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 md:px-9">
        <Link href="/" className="flex items-center gap-1.5" aria-label="Spark home"><Asterisk className="size-9 text-primary" strokeWidth={2.8} /><span className="text-[29px] font-semibold tracking-[-1.5px]">{config.theme.branding}</span><span className="ml-3 hidden border-l pl-4 text-sm text-muted-foreground lg:inline">Documentation</span></Link>
        <div className="w-10 sm:w-72 lg:w-96"><DocSearch key={activeProduct.slug} product={activeProduct.slug} theme={theme} /></div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="lg" />}><span className="hidden sm:inline">Products</span><span className="sm:hidden">Docs</span><ChevronDown data-icon="inline-end" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2" style={theme}>
              <DropdownMenuGroup><DropdownMenuLabel>Your knowledge, connected</DropdownMenuLabel>{products.map(product => <DropdownMenuItem key={product.slug} onClick={() => { setChosenTab(null); router.push(product.config.navigationTree ? firstNavigationHref(product.config.navigationTree, product.slug) ?? pageHref(product.slug) : pageHref(product.slug, product.config.navigation[0]?.pages[0]?.slug)); closeMobile() }} className="gap-3 p-3"><ProductIcon name={product.config.icon} /><div className="flex flex-1 flex-col gap-1"><span className="font-medium">{product.config.name}</span><span className="text-sm text-muted-foreground">{product.config.description}</span></div>{product.slug === activeProduct.slug && <Check />}</DropdownMenuItem>)}</DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="hidden h-5 border-l sm:block" />
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}>{light ? <Moon /> : <Sun />}</Button>
        </div>
      </div>
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between px-5 md:px-9">
        <div className="flex h-full items-center gap-7">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(value => !value)} aria-label="Toggle navigation" aria-expanded={mobileOpen} aria-controls="docs-sidebar">{mobileOpen ? <X /> : <Menu />}</Button>
          {customTabs.length > 0 ? customTabs.map(tab => <button key={tab.id} aria-pressed={currentTab?.id === tab.id} className={`flex h-full items-center gap-2 border-b-2 text-sm font-medium ${currentTab?.id === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`} onClick={() => { setChosenTab(tab.id); const href = firstNavigationHref(tab.children ?? [], activeProduct.slug); if (href) router.push(href) }}><ProductIcon name={tab.icon} />{tab.title}</button>) : <>
          <Link href={pageHref(activeProduct.slug, activeProduct.config.navigation[0]?.pages[0]?.slug)} className={cn('flex h-full items-center border-b-2 text-sm font-medium transition-colors', activeTab === 'documentation' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>Documentation</Link>
          {referencePage && <Link href={pageHref(activeProduct.slug, referencePage)} className={cn('flex h-full items-center border-b-2 text-sm font-medium transition-colors', activeTab === 'reference' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>Reference</Link>}
          {changelogPage && <Link href={pageHref(activeProduct.slug, changelogPage)} className={cn('hidden h-full items-center border-b-2 text-sm font-medium transition-colors sm:flex', activeTab === 'changelog' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>Changelog</Link>}</>}

        </div>
        <a href="https://mdxjs.com/docs/" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex">Made for MDX<ArrowUpRight className="size-3.5" /></a>
      </div>
    </header>
    <div className="mx-auto flex max-w-[1600px]">
      <aside id="docs-sidebar" className={cn('shrink-0 flex-col border-r bg-sidebar lg:sticky lg:top-[125px] lg:flex lg:h-[calc(100dvh-125px)] lg:w-64 xl:w-72', mobileOpen ? 'fixed inset-x-0 top-[125px] z-20 flex h-[calc(100dvh-125px)]' : 'hidden')}>
        <div className="flex-1 overflow-y-auto px-5 py-7 md:px-7">
          <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3"><span className="flex size-8 items-center justify-center rounded-md border bg-background text-primary"><ProductIcon name={config.icon} /></span><span className="flex-1 text-sm font-medium">{config.name}</span><span className="text-sm text-muted-foreground">{config.version}</span></div>
          <nav aria-label="Documentation pages" className="flex flex-col gap-6 pt-8">
            {customTree ? <PublishedNavigation nodes={sidebarNodes} product={activeProduct.slug} activeSlug={currentSlug} onNavigate={closeMobile} /> : <>
            {config.navigation.map(group => <details key={group.group} open className="group/nav"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">{group.group}<ChevronDown className="size-3.5 text-muted-foreground transition-transform group-not-open/nav:-rotate-90" /></summary><div className="flex flex-col gap-1 pt-3">{group.pages.map(page => <Link key={page.slug} href={pageHref(activeProduct.slug, page.slug)} onClick={closeMobile} aria-current={currentSlug === page.slug ? 'page' : undefined} className={cn('docs-nav-page docs-nav-legacy flex items-center gap-3 rounded-lg px-3 py-2 text-sm', currentSlug === page.slug ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-card hover:text-foreground')}><ProductIcon name={page.icon} /><span className="flex-1">{page.title}</span>{currentSlug === page.slug && <span className="size-1.5 rounded-full bg-primary" />}</Link>)}</div></details>)}</>}

          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t px-7 py-5"><Lightbulb className="size-5 text-primary" /><p className="text-sm leading-6 text-muted-foreground">{config.motto}</p>{repositoryPage && <Link onClick={closeMobile} href={pageHref(activeProduct.slug, repositoryPage)} className="flex items-center gap-1 text-sm text-foreground/70 hover:text-primary">Your content. Your repository.<ChevronRight className="size-3.5" /></Link>}</div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  </div>
}

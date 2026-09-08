import { sparkIcons } from '@/lib/spark-logo'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  icons: sparkIcons(),
  title: { default: 'Spark — All ideas start from a spark.', template: '%s · Spark' },
  description: 'A home for your knowledge. Beautiful, repository-powered documentation for your products, stories, and everything in between.',
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#1a1a1a' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`dark bg-background ${inter.variable}`}><body className="font-sans antialiased">{children}</body></html>
}

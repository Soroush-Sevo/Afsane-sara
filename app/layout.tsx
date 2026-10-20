import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Lalezar, Noto_Naskh_Arabic, Vazirmatn } from 'next/font/google'
import './globals.css'

const vazir = Vazirmatn({ subsets: ['arabic', 'latin'], variable: '--font-vazir', display: 'swap' })
const naskh = Noto_Naskh_Arabic({ subsets: ['arabic', 'latin'], variable: '--font-naskh', display: 'swap' })
const lalezar = Lalezar({ subsets: ['arabic', 'latin'], weight: '400', variable: '--font-lalezar', display: 'swap' })

export const metadata: Metadata = {
  title: 'افسانه‌سرا | قصه‌های سرزمین ما',
  description: 'قصه‌های کهن فارسی را بخوان، بشنو و خودت ادامه‌شان را بساز.',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#f8f3e9',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} ${naskh.variable} ${lalezar.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

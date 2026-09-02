import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Montserrat, Oswald } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// El título es del producto y no del panel del entrenador: desde que hay
// portada, la raíz la ve cualquiera. Cada panel declara el suyo en su propio
// layout (`app/dashboard/layout.tsx`, `app/comercio/layout.tsx`).
export const metadata: Metadata = {
  title: 'Mi Entreno',
  description:
    'Entrená con tu plan, sumá repes por tu constancia y canjealas por productos reales. Panel para entrenadores y comercios.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#081324',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${oswald.variable} ${montserrat.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

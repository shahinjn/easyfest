import type { Metadata } from 'next'
import { Sora, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { NavShortlistLink } from '@/components/NavShortlistLink'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Festify — Film Festival Discovery',
  description:
    'Find the right film festivals for your short film. Filter by country, grade, premiere requirement, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${cormorant.variable}`}>
      <body>
        {/* Ambient background orbs */}
        <div className="ambient-bg" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
          <div className="orb orb-5" />
        </div>

        {/* Site content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <header
            className="sticky top-0 z-50"
            style={{
              background: 'rgba(8,4,24,0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <a href="/" className="font-logo text-[1.6rem] leading-none" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Festify
              </a>
              <nav className="flex gap-2">
                <a href="/" className="nav-btn">
                  Discover
                </a>
                <NavShortlistLink />
              </nav>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

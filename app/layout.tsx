import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Festify — Film Festival Discovery',
  description:
    'Find the right film festivals for your short film. Filter by country, grade, premiere requirement, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 min-h-screen`}>
        <header className="border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center gap-3">
          <a href="/" className="text-xl font-bold tracking-tight text-white">
            Festify
          </a>
          <span className="hidden sm:inline text-neutral-500 text-sm">Film Festival Discovery</span>
          <nav className="ml-auto flex gap-4 text-sm text-neutral-400">
            <a href="/" className="hover:text-white transition-colors">
              Search
            </a>
            <a href="/shortlist" className="hover:text-white transition-colors">
              Shortlist
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}

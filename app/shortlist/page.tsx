import { ShortlistView } from '@/components/ShortlistView'

export default function ShortlistPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Shortlist</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Saved in your browser — no account needed. Up to 20 festivals.
        </p>
      </div>
      <ShortlistView />
    </main>
  )
}

import { FestivalSearch } from '@/components/FestivalSearch'

export default function Home() {
  return (
    <main>
      <div className="border-b border-neutral-800 px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-white">Find Your Festival</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Curated short film festivals — filterable by deadline, grade, premiere requirement, and more.
        </p>
      </div>
      <FestivalSearch />
    </main>
  )
}

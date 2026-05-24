import Link from 'next/link'
import { Festival, PREMIERE_LABELS, GRADE_LABELS } from '@/lib/types'
import { StatusPill } from './StatusPill'
import { ShortlistButton } from './ShortlistButton'

function formatDate(d: string | null) {
  if (!d) return null
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPrice(price: number | null) {
  if (price === null) return null
  if (price === 0) return 'Free'
  return `$${price}`
}

export function FestivalCard({ festival }: { festival: Festival }) {
  const {
    id, slug, name, country, grade, status, deadline, oscar_qualifying,
    premiere_requirement, submission_price_usd, festival_start_date, festival_end_date,
  } = festival

  return (
    <div className="group relative bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-600 transition-colors">
      <Link href={`/festivals/${slug}`} className="block p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
              {name}
            </h2>
            <p className="text-sm text-neutral-400 mt-0.5">{country}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {grade && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                grade === 'A' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                grade === 'B' ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' :
                grade === 'C' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                'bg-neutral-700/40 text-neutral-400 border-neutral-600'
              }`}>
                {GRADE_LABELS[grade]}
              </span>
            )}
            {oscar_qualifying && (
              <span
                title="Oscar Qualifying"
                className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30"
              >
                Oscar
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-neutral-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {deadline ? <>Deadline: <span className="text-neutral-200">{formatDate(deadline)}</span></> : 'No deadline'}
          </span>

          {formatPrice(submission_price_usd) && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-neutral-200">{formatPrice(submission_price_usd)}</span>
            </span>
          )}

          <span className="text-neutral-500">{PREMIERE_LABELS[premiere_requirement]}</span>

          {festival_start_date && (
            <span className="text-neutral-500">
              {formatDate(festival_start_date)}
              {festival_end_date && ` – ${formatDate(festival_end_date)}`}
            </span>
          )}
        </div>

        <div className="mt-3">
          <StatusPill status={status} />
        </div>
      </Link>

      <div className="px-4 pb-4 flex justify-end">
        <ShortlistButton id={id} name={name} />
      </div>
    </div>
  )
}

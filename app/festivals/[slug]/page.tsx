'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Festival, PREMIERE_LABELS, GRADE_LABELS } from '@/lib/types'
import { StatusPill } from '@/components/StatusPill'
import { ShortlistButton } from '@/components/ShortlistButton'

function formatDate(d: string | null) {
  if (!d) return null
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatPrice(price: number | null) {
  if (price === null) return null
  if (price === 0) return 'Free'
  return `$${price}`
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-3 border-b border-neutral-800">
      <dt className="text-sm text-neutral-500 sm:w-44 shrink-0">{label}</dt>
      <dd className="text-sm text-neutral-200">{value}</dd>
    </div>
  )
}

export default function FestivalPage() {
  const params = useParams()
  const slug = params.slug as string
  const [festival, setFestival] = useState<Festival | null | 'loading'>('loading')

  useEffect(() => {
    supabase
      .from('festivals')
      .select('*')
      .eq('slug', slug)
      .eq('is_archived', false)
      .single()
      .then(({ data }) => setFestival(data ?? null))
  }, [slug])

  if (festival === 'loading') {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-neutral-500 text-sm">Loading…</div>
      </main>
    )
  }

  if (!festival) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-neutral-400">Festival not found.</p>
        <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm mt-4 inline-block">
          ← Back to search
        </Link>
      </main>
    )
  }

  const {
    id, name, country, city, website_url, submission_url,
    premiere_requirement, oscar_qualifying, grade, submission_price_usd,
    waiver_available, deadline, early_deadline, festival_start_date,
    festival_end_date, festival_dates_raw, status, enrichment_confidence,
    notes, last_checked_at,
  } = festival

  const festivalDates = festival_start_date
    ? `${formatDate(festival_start_date)}${festival_end_date ? ` – ${formatDate(festival_end_date)}` : ''}`
    : festival_dates_raw || null

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-sm text-neutral-500 mb-6">
        <Link href="/" className="hover:text-neutral-300 transition-colors">Search</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-300">{name}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">{name}</h1>
            <p className="text-neutral-400 mt-1">{city ? `${city}, ${country}` : country}</p>
          </div>
          <ShortlistButton id={id} name={name} className="mt-1" />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <StatusPill status={status} />
          {oscar_qualifying && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border bg-amber-500/15 text-amber-400 border-amber-500/30">
              Oscar Qualifying
            </span>
          )}
          {grade && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
              grade === 'A' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
              grade === 'B' ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' :
              grade === 'C' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
              'bg-neutral-700/40 text-neutral-400 border-neutral-600'
            }`}>
              {GRADE_LABELS[grade]}
            </span>
          )}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 mb-8">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Submission Info
        </h2>
        <dl className="divide-y divide-neutral-800">
          <DataRow label="Status" value={<span className="capitalize">{status.replace('_', ' ')}</span>} />
          <DataRow label="Deadline" value={formatDate(deadline)} />
          <DataRow label="Early Deadline" value={formatDate(early_deadline)} />
          <DataRow label="Entry Fee" value={formatPrice(submission_price_usd)} />
          {waiver_available && <DataRow label="Fee Waiver" value="Available" />}
          <DataRow label="Festival Dates" value={festivalDates} />
          <DataRow label="Premiere Requirement" value={PREMIERE_LABELS[premiere_requirement]} />
          <DataRow label="Oscar Qualifying" value={oscar_qualifying ? 'Yes' : 'No'} />
          {grade && <DataRow label="Grade" value={GRADE_LABELS[grade]} />}
        </dl>

        {submission_url && (
          <a
            href={submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
          >
            Submit Your Film
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {notes && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 mb-8">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Notes</h2>
          <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{notes}</p>
        </div>
      )}

      <div className="text-xs text-neutral-600 flex flex-wrap gap-x-4 gap-y-1">
        {last_checked_at && (
          <span>Last checked: {formatDate(last_checked_at.split('T')[0])}</span>
        )}
        {enrichment_confidence && (
          <span>Data confidence: {enrichment_confidence}</span>
        )}
        {website_url && (
          <a href={website_url} target="_blank" rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Official website
          </a>
        )}
      </div>
    </main>
  )
}

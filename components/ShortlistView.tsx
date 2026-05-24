'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Festival, PREMIERE_LABELS, STATUS_LABELS } from '@/lib/types'
import { StatusPill } from './StatusPill'
import { ShortlistButton } from './ShortlistButton'
import { useShortlist } from '@/hooks/useShortlist'

function formatDate(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPrice(price: number | null) {
  if (price === null) return '—'
  if (price === 0) return 'Free'
  return `$${price}`
}

export function ShortlistView() {
  const { ids, count, clear, mounted } = useShortlist()
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!mounted || ids.length === 0) {
      setFestivals([])
      return
    }
    setLoading(true)
    supabase
      .from('festivals')
      .select('*')
      .in('id', ids)
      .then(({ data }) => {
        setFestivals(data ?? [])
        setLoading(false)
      })
  }, [ids, mounted])

  if (!mounted) return null

  if (count === 0) {
    return (
      <div className="text-center py-20 text-neutral-500">
        <p className="text-lg mb-2">Your shortlist is empty</p>
        <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
          Browse festivals →
        </Link>
      </div>
    )
  }

  const exportCsv = () => {
    const headers = ['Name', 'Country', 'Deadline', 'Fee', 'Premiere', 'Oscar', 'Status', 'Submission URL']
    const rows = festivals.map((f) => [
      f.name,
      f.country,
      f.deadline ?? '',
      formatPrice(f.submission_price_usd),
      PREMIERE_LABELS[f.premiere_requirement],
      f.oscar_qualifying ? 'Yes' : 'No',
      STATUS_LABELS[f.status],
      f.submission_url ?? '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'festify-shortlist.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-neutral-400">
          <span className="text-white font-medium">{count}</span> festival{count !== 1 ? 's' : ''} shortlisted
        </p>
        <div className="flex gap-3">
          <button
            onClick={exportCsv}
            className="text-xs text-neutral-400 hover:text-white border border-neutral-700 px-3 py-1.5 rounded-md transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              if (confirm('Clear your entire shortlist?')) clear()
            }}
            className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-md transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-neutral-500 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wider border-b border-neutral-800">
                <th className="pb-3 pr-4 font-medium">Festival</th>
                <th className="pb-3 pr-4 font-medium">Deadline</th>
                <th className="pb-3 pr-4 font-medium">Fee</th>
                <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Premiere</th>
                <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Status</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {festivals.map((f) => (
                <tr key={f.id} className="group hover:bg-neutral-900/50 transition-colors">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/festivals/${f.slug}`}
                      className="font-medium text-white hover:text-amber-400 transition-colors"
                    >
                      {f.name}
                    </Link>
                    <p className="text-neutral-500 text-xs mt-0.5">{f.country}</p>
                    {f.oscar_qualifying && (
                      <span className="inline-block text-xs text-amber-400 mt-0.5">Oscar Qualifying</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-neutral-300 whitespace-nowrap">
                    {formatDate(f.deadline)}
                  </td>
                  <td className="py-3 pr-4 text-neutral-300">{formatPrice(f.submission_price_usd)}</td>
                  <td className="py-3 pr-4 text-neutral-400 hidden sm:table-cell">
                    {PREMIERE_LABELS[f.premiere_requirement]}
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <StatusPill status={f.status} />
                  </td>
                  <td className="py-3">
                    <ShortlistButton id={f.id} name={f.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

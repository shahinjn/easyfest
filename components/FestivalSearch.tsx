'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Festival, FestivalFilters, DEFAULT_FILTERS } from '@/lib/types'
import { FilterPanel } from './FilterPanel'
import { FestivalCard } from './FestivalCard'

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  closing_soon: 1,
  upcoming: 2,
  closed: 3,
  previous_edition: 4,
  unknown: 5,
}

function sortFestivals(festivals: Festival[]): Festival[] {
  return [...festivals].sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 5) - (STATUS_ORDER[b.status] ?? 5)
    if (statusDiff !== 0) return statusDiff
    // Within same status, soonest deadline first
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return 0
  })
}

function applyFilters(festivals: Festival[], filters: FestivalFilters): Festival[] {
  return festivals.filter((f) => {
    if (filters.search && !f.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.country.length > 0 && !filters.country.includes(f.country)) return false
    if (filters.grade.length > 0 && (!f.grade || !filters.grade.includes(f.grade))) return false
    if (filters.status.length > 0 && !filters.status.includes(f.status)) return false
    if (filters.premiere_requirement.length > 0 && !filters.premiere_requirement.includes(f.premiere_requirement)) return false
    if (filters.oscar_qualifying === 'yes' && !f.oscar_qualifying) return false
    if (filters.oscar_qualifying === 'no' && f.oscar_qualifying) return false
    if (filters.maxPrice !== null) {
      if (filters.maxPrice === 0) {
        if (f.submission_price_usd !== null && f.submission_price_usd !== 0) return false
      } else {
        if (f.submission_price_usd !== null && f.submission_price_usd > filters.maxPrice) return false
      }
    }
    return true
  })
}

export function FestivalSearch() {
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FestivalFilters>(DEFAULT_FILTERS)

  useEffect(() => {
    supabase
      .from('festivals')
      .select('*')
      .eq('is_archived', false)
      .order('deadline', { ascending: true, nullsFirst: false })
      .then(({ data, error }) => {
        if (error) { console.error('Supabase error:', JSON.stringify(error), error.message, error.code); return }
        const rows = (data ?? []) as Festival[]
        setFestivals(rows)
        const unique = [...new Set(rows.map((r) => r.country))].sort()
        setCountries(unique)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => sortFestivals(applyFilters(festivals, filters)), [festivals, filters])

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-4">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            countries={countries}
            totalCount={festivals.length}
            filteredCount={filtered.length}
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="text-center py-20 text-neutral-500 text-sm">Loading festivals…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <p className="text-lg mb-2">No festivals match your filters</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((f) => (
              <FestivalCard key={f.id} festival={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

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
        if (error) { console.error('Supabase error:', JSON.stringify(error)); return }
        const rows = (data ?? []) as Festival[]
        setFestivals(rows)
        const unique = [...new Set(rows.map((r) => r.country))].sort()
        setCountries(unique)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => sortFestivals(applyFilters(festivals, filters)), [festivals, filters])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 60px' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Sidebar — desktop only, mobile toggle inside FilterPanel */}
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          countries={countries}
          totalCount={festivals.length}
          filteredCount={filtered.length}
        />

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Loading festivals…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.3)' }}>
              <p style={{ fontSize: 16, marginBottom: 12 }}>No festivals match your filters</p>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(140,100,255,0.7)', fontFamily: 'inherit', fontSize: 14,
                }}
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
                Showing <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{filtered.length}</span>
                {' '}of {festivals.length} festivals
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((f) => (
                  <FestivalCard key={f.id} festival={f} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

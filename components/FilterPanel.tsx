'use client'

import { useState, useRef, useEffect } from 'react'
import { FestivalFilters, FestivalGrade, FestivalStatus, PremiereRequirement, DEFAULT_FILTERS, STATUS_LABELS, PREMIERE_LABELS, GRADE_LABELS } from '@/lib/types'

function CountrySelect({
  countries,
  selected,
  onChange,
}: {
  countries: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = countries.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  const toggle = (country: string) => {
    onChange(
      selected.includes(country) ? selected.filter((c) => c !== country) : [...selected, country]
    )
  }

  return (
    <div>
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Country</p>
      <div ref={ref} className="relative">
        <div
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-200 cursor-pointer flex items-center justify-between"
          onClick={() => setOpen((o) => !o)}
        >
          <span className={selected.length === 0 ? 'text-neutral-500' : ''}>
            {selected.length === 0 ? 'Any country' : selected.length === 1 ? selected[0] : `${selected.length} countries`}
          </span>
          <svg className={`w-4 h-4 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open && (
          <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-md shadow-xl">
            <div className="p-2">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search countries…"
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto pb-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-neutral-500">No results</li>
              )}
              {filtered.map((c) => (
                <li
                  key={c}
                  onClick={() => toggle(c)}
                  className={`px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                    selected.includes(c)
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {selected.includes(c) && (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {c}
                </li>
              ))}
            </ul>
            {selected.length > 0 && (
              <div className="border-t border-neutral-700 p-2">
                <button
                  onClick={() => { onChange([]); setOpen(false) }}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  filters: FestivalFilters
  onChange: (f: FestivalFilters) => void
  countries: string[]
  totalCount: number
  filteredCount: number
}

function MultiSelect<T extends string>({
  label,
  options,
  labels,
  selected,
  onChange,
}: {
  label: string
  options: T[]
  labels: Record<T, string>
  selected: T[]
  onChange: (v: T[]) => void
}) {
  const toggle = (val: T) => {
    onChange(selected.includes(val) ? selected.filter((x) => x !== val) : [...selected, val])
  }

  return (
    <div>
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              selected.includes(opt)
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function FilterPanel({ filters, onChange, countries, totalCount, filteredCount }: Props) {
  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  const set = <K extends keyof FestivalFilters>(key: K, val: FestivalFilters[K]) =>
    onChange({ ...filters, [key]: val })

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          <span className="text-white font-medium">{filteredCount}</span> of {totalCount} festivals
        </p>
        {isDirty && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2 block">
          Search
        </label>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Festival name…"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
        />
      </div>

      {/* Status */}
      <MultiSelect
        label="Status"
        options={['open', 'closing_soon', 'upcoming', 'closed', 'previous_edition', 'unknown'] as FestivalStatus[]}
        labels={STATUS_LABELS}
        selected={filters.status}
        onChange={(v) => set('status', v)}
      />

      {/* Grade */}
      <MultiSelect
        label="Grade"
        options={['A', 'B', 'C', 'D'] as FestivalGrade[]}
        labels={GRADE_LABELS}
        selected={filters.grade}
        onChange={(v) => set('grade', v)}
      />

      {/* Oscar */}
      <div>
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
          Oscar Qualifying
        </p>
        <div className="flex gap-1.5">
          {(['all', 'yes', 'no'] as const).map((v) => (
            <button
              key={v}
              onClick={() => set('oscar_qualifying', v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                filters.oscar_qualifying === v
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
              }`}
            >
              {v === 'all' ? 'All' : v === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {/* Premiere */}
      <MultiSelect
        label="Premiere Requirement"
        options={['none', 'regional', 'north_american', 'international', 'world'] as PremiereRequirement[]}
        labels={PREMIERE_LABELS}
        selected={filters.premiere_requirement}
        onChange={(v) => set('premiere_requirement', v)}
      />

      {/* Country */}
      <CountrySelect
        countries={countries}
        selected={filters.country}
        onChange={(v) => set('country', v)}
      />

      {/* Price */}
      <div>
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Max Entry Fee</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Any', val: null },
            { label: 'Free', val: 0 },
            { label: 'Under $30', val: 30 },
            { label: 'Under $60', val: 60 },
          ].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => set('maxPrice', val)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                filters.maxPrice === val
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

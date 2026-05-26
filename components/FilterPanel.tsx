'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FestivalFilters, FestivalGrade, FestivalStatus, PremiereRequirement,
  DEFAULT_FILTERS, STATUS_LABELS, PREMIERE_LABELS, GRADE_LABELS,
} from '@/lib/types'

/* ── Country searchable dropdown ──────────────────────────── */
function CountrySelect({ countries, selected, onChange }: {
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
  const toggle = (country: string) =>
    onChange(selected.includes(country) ? selected.filter((c) => c !== country) : [...selected, country])

  return (
    <div>
      <span className="section-label">Country</span>
      <div ref={ref} className="relative">
        <div
          onClick={() => setOpen((o) => !o)}
          style={{
            padding: '8px 12px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: selected.length === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
          }}
        >
          <span>
            {selected.length === 0 ? 'Any country' : selected.length === 1 ? selected[0] : `${selected.length} countries`}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open && (
          <div style={{
            position: 'absolute', zIndex: 20, top: 'calc(100% + 4px)',
            width: '100%', borderRadius: 14,
            background: 'rgba(20,14,40,0.96)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ padding: '8px 8px 4px' }}>
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="glass-input"
                style={{ padding: '8px 12px', fontSize: 13, borderRadius: 10 }}
              />
            </div>
            <ul style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0 8px' }}>
              {filtered.length === 0 && (
                <li style={{ padding: '8px 14px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No results</li>
              )}
              {filtered.map((c) => (
                <li
                  key={c}
                  onClick={() => toggle(c)}
                  style={{
                    padding: '7px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: selected.includes(c) ? '#c8b4ff' : 'rgba(255,255,255,0.7)',
                    background: selected.includes(c) ? 'rgba(140,100,255,0.15)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  {selected.includes(c) && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#c8b4ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {c}
                </li>
              ))}
            </ul>
            {selected.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px' }}>
                <button
                  onClick={() => { onChange([]); setOpen(false) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit' }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Chip group ───────────────────────────────────────────── */
function ChipGroup<T extends string>({
  label, options, labels, selected, onChange,
}: {
  label: string
  options: T[]
  labels: Record<T, string>
  selected: T[]
  onChange: (v: T[]) => void
}) {
  const toggle = (val: T) =>
    onChange(selected.includes(val) ? selected.filter((x) => x !== val) : [...selected, val])

  return (
    <div>
      <span className="section-label">{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`filter-chip ${selected.includes(opt) ? 'active' : ''}`}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Oscar toggle ─────────────────────────────────────────── */
function OscarToggle({ value, onChange }: {
  value: 'all' | 'yes' | 'no'
  onChange: (v: 'all' | 'yes' | 'no') => void
}) {
  return (
    <div>
      <span className="section-label">Oscar Qualifying</span>
      <div className="toggle-group">
        {(['all', 'yes', 'no'] as const).map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={value === v ? 'active' : ''}
          >
            {v === 'all' ? 'All' : v === 'yes' ? '⭐ Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Price selector ───────────────────────────────────────── */
function PriceSelect({ value, onChange }: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  const opts = [
    { label: 'Any', val: null },
    { label: 'Free', val: 0 },
    { label: '< $30', val: 30 },
    { label: '< $60', val: 60 },
  ]
  return (
    <div>
      <span className="section-label">Max Entry Fee</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {opts.map(({ label, val }) => (
          <button
            key={label}
            onClick={() => onChange(val)}
            className={`filter-chip ${value === val ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main FilterPanel ─────────────────────────────────────── */
interface Props {
  filters: FestivalFilters
  onChange: (f: FestivalFilters) => void
  countries: string[]
  totalCount: number
  filteredCount: number
}

export function FilterPanel({ filters, onChange, countries, totalCount, filteredCount }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  const set = <K extends keyof FestivalFilters>(key: K, val: FestivalFilters[K]) =>
    onChange({ ...filters, [key]: val })

  const activeDot = isDirty ? ' •' : ''

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Count + reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{filteredCount}</span> of {totalCount}
        </span>
        {isDirty && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)' }}
          >
            Reset all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search festivals…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: 'inherit',
            }}
          />
          {filters.search && (
            <button onClick={() => set('search', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>✕</button>
          )}
        </div>
      </div>

      {/* Status */}
      <ChipGroup<FestivalStatus>
        label="Status"
        options={['open', 'closing_soon', 'upcoming', 'closed', 'previous_edition']}
        labels={STATUS_LABELS}
        selected={filters.status}
        onChange={(v) => set('status', v)}
      />

      {/* Grade */}
      <ChipGroup<FestivalGrade>
        label="Prestige Tier"
        options={['A', 'B', 'C', 'D']}
        labels={GRADE_LABELS}
        selected={filters.grade}
        onChange={(v) => set('grade', v)}
      />

      {/* Oscar */}
      <OscarToggle value={filters.oscar_qualifying} onChange={(v) => set('oscar_qualifying', v)} />

      {/* Premiere */}
      <ChipGroup<PremiereRequirement>
        label="Premiere Requirement"
        options={['none', 'regional', 'north_american', 'international', 'world']}
        labels={PREMIERE_LABELS}
        selected={filters.premiere_requirement}
        onChange={(v) => set('premiere_requirement', v)}
      />

      {/* Country */}
      <CountrySelect countries={countries} selected={filters.country} onChange={(v) => set('country', v)} />

      {/* Price */}
      <PriceSelect value={filters.maxPrice} onChange={(v) => set('maxPrice', v)} />
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <div className="mobile-filter-btn" style={{ marginBottom: 12 }}>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="glass-btn"
          style={{ fontSize: 13 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filters{activeDot}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="glass-sidebar mobile-filter-btn" style={{ padding: 20, marginBottom: 16, display: 'block' }}>
          {content}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="glass-sidebar desktop-sidebar"
        style={{
          padding: 20,
          width: 272,
          flexShrink: 0,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 96px)',
          position: 'sticky',
          top: 80,
        }}
      >
        {content}
      </aside>
    </>
  )
}

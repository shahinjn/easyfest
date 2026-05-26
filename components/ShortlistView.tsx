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

const th: React.CSSProperties = {
  padding: '12px 14px 10px',
  textAlign: 'left',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: 'rgba(255,255,255,0.7)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  verticalAlign: 'middle',
}

export function ShortlistView() {
  const { ids, count, clear, mounted } = useShortlist()
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!mounted || ids.length === 0) { setFestivals([]); return }
    setLoading(true)
    supabase.from('festivals').select('*').in('id', ids).then(({ data }) => {
      setFestivals(data ?? [])
      setLoading(false)
    })
  }, [ids, mounted])

  if (!mounted) return null

  if (count === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 44, opacity: 0.2, marginBottom: 16 }}>☆</div>
        <p style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
          No festivals shortlisted yet
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
          Browse the directory and tap ☐ on any festival to save it here.
        </p>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="glass-btn glass-btn-primary">Browse festivals →</span>
        </Link>
      </div>
    )
  }

  const exportCsv = () => {
    const headers = ['Name', 'Country', 'Deadline', 'Fee', 'Premiere', 'Oscar', 'Status', 'Submission URL']
    const rows = festivals.map((f) => [
      f.name, f.country, f.deadline ?? '', formatPrice(f.submission_price_usd),
      PREMIERE_LABELS[f.premiere_requirement], f.oscar_qualifying ? 'Yes' : 'No',
      STATUS_LABELS[f.status], f.submission_url ?? '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'festify-shortlist.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{count}</span>{' '}
          festival{count !== 1 ? 's' : ''} saved
          <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>(max 20)</span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCsv} className="glass-btn" style={{ fontSize: 12, padding: '7px 14px' }}>
            ↓ Export CSV
          </button>
          <button
            onClick={() => { if (confirm('Clear your entire shortlist?')) clear() }}
            className="glass-btn"
            style={{ fontSize: 12, padding: '7px 14px', color: '#f08a7f', borderColor: 'rgba(231,76,60,0.2)' }}
          >
            Clear all
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          {/* Mobile card stack */}
          <div className="shortlist-cards">
            {festivals.map((f) => (
              <div key={f.id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/festivals/${f.slug}`}
                      style={{ fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}
                    >
                      {f.name}
                    </Link>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{f.country}</p>
                  </div>
                  <ShortlistButton id={f.id} name={f.name} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {[
                    { label: 'Deadline', value: formatDate(f.deadline) },
                    { label: 'Fee', value: formatPrice(f.submission_price_usd) },
                    { label: 'Oscar', value: f.oscar_qualifying ? '⭐ Yes' : 'No' },
                    { label: 'Status', value: <StatusPill status={f.status} /> },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="shortlist-table">
            <div className="glass-card" style={{ overflow: 'hidden', padding: 0, borderRadius: 16 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Festival</th>
                      <th style={th}>Deadline</th>
                      <th style={th}>Fee</th>
                      <th style={th}>Premiere</th>
                      <th style={th}>Status</th>
                      <th style={{ ...th, width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {festivals.map((f) => (
                      <tr key={f.id} style={{ transition: 'background 0.1s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={td}>
                          <Link
                            href={`/festivals/${f.slug}`}
                            style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}
                          >
                            {f.name}
                          </Link>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                            {f.country}
                            {f.oscar_qualifying && <span style={{ marginLeft: 6, color: '#f5d74e' }}>⭐</span>}
                          </p>
                        </td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDate(f.deadline)}</td>
                        <td style={td}>{formatPrice(f.submission_price_usd)}</td>
                        <td style={{ ...td, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                          {PREMIERE_LABELS[f.premiere_requirement]}
                        </td>
                        <td style={td}><StatusPill status={f.status} /></td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <ShortlistButton id={f.id} name={f.name} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
      gap: 16,
    }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500, textAlign: 'right' }}>{children}</span>
    </div>
  )
}

const GRADE_STYLES: Record<string, React.CSSProperties> = {
  A: { background: 'rgba(167,139,250,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' },
  B: { background: 'rgba(96,165,250,0.2)',  color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' },
  C: { background: 'rgba(110,231,183,0.2)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.3)' },
  D: { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  if (!festival) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Festival not found.</p>
        <Link href="/" className="glass-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          ← Back to search
        </Link>
      </div>
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
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Back nav */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          ← Discover
        </Link>
      </div>

      {/* Main card */}
      <div
        className="glass-sidebar detail-scroll"
        style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3 }}>
                {name}
              </h1>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11 }}>◉</span>
                {city ? `${city}, ${country}` : country}
              </div>
            </div>
            <ShortlistButton id={id} name={name} size={26} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            <StatusPill status={status} />
            {oscar_qualifying && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, lineHeight: '18px',
                background: 'rgba(241,196,15,0.15)', color: '#f5d74e', border: '1px solid rgba(241,196,15,0.25)',
              }}>
                <span style={{ fontSize: 11 }}>⭐</span> Oscar Qualifying
              </span>
            )}
            {grade && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                borderRadius: 20, fontSize: 12, fontWeight: 500, lineHeight: '18px',
                ...GRADE_STYLES[grade],
              }}>
                {GRADE_LABELS[grade]}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 24px 24px' }}>
          {/* Key details */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 14,
            padding: '4px 18px', border: '1px solid rgba(255,255,255,0.05)',
            marginTop: 16,
          }}>
            <MetaRow label="Status">
              <StatusPill status={status} />
            </MetaRow>
            <MetaRow label="Deadline">{formatDate(deadline)}</MetaRow>
            <MetaRow label="Early Deadline">{formatDate(early_deadline)}</MetaRow>
            <MetaRow label="Entry Fee">
              {formatPrice(submission_price_usd)}
              {waiver_available && <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(140,100,255,0.7)' }}>(waiver available)</span>}
            </MetaRow>
            <MetaRow label="Festival Dates">{festivalDates}</MetaRow>
            <MetaRow label="Premiere Requirement">{PREMIERE_LABELS[premiere_requirement]}</MetaRow>
            <MetaRow label="Oscar Qualifying">{oscar_qualifying ? '⭐ Yes' : 'No'}</MetaRow>
            {grade && <MetaRow label="Grade">{GRADE_LABELS[grade]}</MetaRow>}
          </div>

          {/* Notes */}
          {notes && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: 'rgba(140,100,255,0.06)',
              border: '1px solid rgba(140,100,255,0.12)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(140,100,255,0.6)', textTransform: 'uppercase', marginBottom: 6 }}>
                Notes
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-line' }}>
                {notes}
              </div>
            </div>
          )}

          {/* Last verified */}
          <div style={{
            marginTop: 12, padding: '10px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            fontSize: 12, color: 'rgba(255,255,255,0.3)',
          }}>
            <span>🔍</span>
            {last_checked_at && <>Last verified: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{formatDate(last_checked_at.split('T')[0])}</strong></>}
            {enrichment_confidence && <span style={{ marginLeft: 4 }}>· Confidence: {enrichment_confidence}</span>}
            {website_url && (
              <a
                href={website_url} target="_blank" rel="noopener noreferrer"
                style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              >
                Official website ↗
              </a>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {submission_url && (
              <a
                href={submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn glass-btn-primary"
                style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', minWidth: 140 }}
              >
                Submit Your Film ↗
              </a>
            )}
            <Link
              href="/"
              className="glass-btn"
              style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', minWidth: 140 }}
            >
              ← Back to search
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

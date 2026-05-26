import Link from 'next/link'
import { Festival, PREMIERE_LABELS } from '@/lib/types'
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

const GRADE_STYLES: Record<string, React.CSSProperties> = {
  A: { background: 'rgba(167,139,250,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' },
  B: { background: 'rgba(96,165,250,0.2)',  color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' },
  C: { background: 'rgba(110,231,183,0.2)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.3)' },
  D: { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' },
}

export function FestivalCard({ festival }: { festival: Festival }) {
  const {
    id, slug, name, country, grade, status, deadline, oscar_qualifying,
    premiere_requirement, submission_price_usd,
  } = festival

  const gradeStyle = grade ? GRADE_STYLES[grade] : null
  const formattedDeadline = formatDate(deadline)
  const formattedPrice = formatPrice(submission_price_usd)

  return (
    <div className="glass-card group relative">
      <Link href={`/festivals/${slug}`} className="block p-4" style={{ paddingRight: '3.5rem' }}>
        {/* Name + location */}
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h2
              className="font-semibold leading-snug transition-colors"
              style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15 }}
            >
              {name}
            </h2>
            <p className="mt-0.5 flex items-center gap-1" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ fontSize: 10 }}>◉</span> {country}
            </p>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatusPill status={status} />

          {oscar_qualifying && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20,
              fontSize: 12, fontWeight: 500, lineHeight: '18px',
              background: 'rgba(241,196,15,0.15)',
              color: '#f5d74e',
              border: '1px solid rgba(241,196,15,0.25)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 11 }}>⭐</span> Oscar
            </span>
          )}

          {gradeStyle && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: 20,
              fontSize: 12, fontWeight: 500, lineHeight: '18px',
              whiteSpace: 'nowrap',
              ...gradeStyle,
            }}>
              Tier {grade}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {formattedDeadline && (
            <span>
              Deadline: <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{formattedDeadline}</span>
            </span>
          )}
          {formattedPrice && (
            <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{formattedPrice}</span>
          )}
          {premiere_requirement && premiere_requirement !== 'none' && (
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>
              {PREMIERE_LABELS[premiere_requirement]}
            </span>
          )}
        </div>
      </Link>

      {/* Shortlist button — floated top-right, outside the link */}
      <div className="absolute top-4 right-4">
        <ShortlistButton id={id} name={name} />
      </div>
    </div>
  )
}

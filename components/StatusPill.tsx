import { FestivalStatus, STATUS_LABELS } from '@/lib/types'

const STYLES: Record<FestivalStatus, React.CSSProperties> = {
  open: {
    background: 'rgba(46,204,113,0.15)',
    color: '#5beca5',
    border: '1px solid rgba(46,204,113,0.25)',
  },
  closing_soon: {
    background: 'rgba(243,156,18,0.15)',
    color: '#f5c563',
    border: '1px solid rgba(243,156,18,0.25)',
  },
  closed: {
    background: 'rgba(231,76,60,0.15)',
    color: '#f08a7f',
    border: '1px solid rgba(231,76,60,0.25)',
  },
  upcoming: {
    background: 'rgba(96,165,250,0.15)',
    color: '#93c5fd',
    border: '1px solid rgba(96,165,250,0.25)',
  },
  previous_edition: {
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.45)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  unknown: {
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
}

export function StatusPill({ status }: { status: FestivalStatus }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        ...STYLES[status],
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

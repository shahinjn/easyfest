import { FestivalStatus, STATUS_LABELS } from '@/lib/types'

const COLORS: Record<FestivalStatus, string> = {
  open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closing_soon: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  closed: 'bg-red-500/15 text-red-400 border-red-500/30',
  upcoming: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  previous_edition: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30',
  unknown: 'bg-neutral-700/30 text-neutral-500 border-neutral-600/30',
}

export function StatusPill({ status }: { status: FestivalStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

'use client'

import { useShortlist } from '@/hooks/useShortlist'

export function ShortlistButton({
  id,
  name,
  size = 22,
}: {
  id: string
  name: string
  size?: number
}) {
  const { has, toggle, isFull, mounted } = useShortlist()

  if (!mounted) return <div style={{ width: size, height: size }} />

  const inList = has(id)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!inList && isFull) {
          alert('Shortlist is full (20 max). Remove a festival first.')
          return
        }
        toggle(id)
      }}
      title={inList ? `Remove ${name} from shortlist` : `Add ${name} to shortlist`}
      className={`shortlist-check ${inList ? 'checked' : ''}`}
      style={{ width: size, height: size }}
    >
      {inList && (
        <svg width={size - 8} height={size - 8} viewBox="0 0 16 16" fill="none">
          <path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            stroke="#c8b4ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

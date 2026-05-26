'use client'

import { useShortlist } from '@/hooks/useShortlist'

export function NavShortlistLink() {
  const { count, mounted } = useShortlist()

  return (
    <a href="/shortlist" className="nav-btn">
      Shortlist{mounted && count > 0 ? ` (${count})` : ''}
    </a>
  )
}

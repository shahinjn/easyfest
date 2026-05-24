'use client'

import { useState, useEffect, useCallback } from 'react'

const KEY = 'festify_shortlist'
const MAX = 20

export function useShortlist() {
  const [ids, setIds] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setIds(JSON.parse(stored))
    } catch {}
  }, [])

  const persist = useCallback((next: string[]) => {
    setIds(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }, [])

  const add = useCallback(
    (id: string) => {
      setIds((prev) => {
        if (prev.includes(id) || prev.length >= MAX) return prev
        const next = [...prev, id]
        try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
        return next
      })
    },
    []
  )

  const remove = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.filter((x) => x !== id)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((x) => x !== id)
          try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
          return next
        }
        if (prev.length >= MAX) return prev
        const next = [...prev, id]
        try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
        return next
      })
    },
    []
  )

  const clear = useCallback(() => persist([]), [persist])

  return {
    ids,
    count: ids.length,
    isFull: ids.length >= MAX,
    has: (id: string) => ids.includes(id),
    add,
    remove,
    toggle,
    clear,
    mounted,
  }
}

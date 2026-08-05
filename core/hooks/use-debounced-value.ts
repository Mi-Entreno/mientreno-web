"use client"

import { useEffect, useState } from "react"

/**
 * Delays a value so a request is not fired on every keystroke.
 *
 * The setState here is intentional and lint-clean: it is not seeding state from
 * an external source on mount, it is the debounce itself — the effect exists to
 * schedule a future update and cancels it when the input changes again.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

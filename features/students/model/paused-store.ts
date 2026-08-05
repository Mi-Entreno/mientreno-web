/**
 * Remembers subscriptions the trainer paused from this browser.
 *
 * Pure workaround. `SubscriptionService.getActiveByTrainer` filters to ACTIVE,
 * so pausing removes the student from the roster and nothing lists paused
 * subscriptions — `PATCH /resume` becomes unreachable because the trainer can
 * no longer discover the id (`docs/BACKEND_CHANGE_REQUEST.md`, problem 2).
 *
 * Keeping the ids locally lets the detail endpoint (which does not filter by
 * status) bring those rows back. Its limits are the obvious ones: another
 * browser, or cleared storage, and the subscription is lost from view again.
 *
 * Shaped as an external store so `useSyncExternalStore` can read it without an
 * effect: seeding React state from localStorage in `useEffect` means a
 * setState on every mount, which is both a cascading render and a lint error.
 *
 * **Delete this file** once the roster endpoint returns PAUSED as well.
 */
const KEY = "trainer-dashboard.paused-subscriptions"

/** Stable reference for the server snapshot; a new array each call would loop. */
const EMPTY: readonly number[] = Object.freeze([])

let cache: readonly number[] = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function parse(): readonly number[] {
  if (typeof window === "undefined") return EMPTY

  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY

    return normalise(parsed.filter((item): item is number => typeof item === "number"))
  } catch {
    return EMPTY
  }
}

function normalise(ids: number[]): readonly number[] {
  return Object.freeze([...new Set(ids)].sort((a, b) => a - b))
}

function same(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function persist(ids: readonly number[]): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    // Private mode or a full quota: the roster simply loses the paused rows.
  }
}

function emit(): void {
  for (const listener of listeners) listener()
}

/** No-ops when nothing changed, so subscribers do not re-render pointlessly. */
function set(next: number[]): readonly number[] {
  const normalised = normalise(next)
  loaded = true

  if (same(normalised, cache)) return cache

  cache = normalised
  persist(normalised)
  emit()
  return cache
}

export const pausedStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  getSnapshot(): readonly number[] {
    if (!loaded) {
      cache = parse()
      loaded = true
    }
    return cache
  },

  getServerSnapshot(): readonly number[] {
    return EMPTY
  },

  /** Re-reads localStorage. Used by the cross-tab listener and by tests. */
  refresh(): readonly number[] {
    const next = parse()
    loaded = true

    if (!same(next, cache)) {
      cache = next
      emit()
    }
    return cache
  },

  remember(subscriptionId: number): readonly number[] {
    return set([...pausedStore.getSnapshot(), subscriptionId])
  },

  forget(subscriptionId: number): readonly number[] {
    return set(pausedStore.getSnapshot().filter((id) => id !== subscriptionId))
  },

  /** Drops ids that are no longer paused, whoever changed them. */
  reconcile(stillPaused: number[]): readonly number[] {
    return set(stillPaused)
  },
}

// Keeps two open tabs in agreement about what is paused.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) pausedStore.refresh()
  })
}

import { beforeEach, describe, expect, it, vi } from "vitest"

import { pausedStore } from "./paused-store"

const KEY = "trainer-dashboard.paused-subscriptions"

beforeEach(() => {
  window.localStorage.clear()
  // The store caches its snapshot (useSyncExternalStore requires a stable
  // reference), so clearing storage alone is not enough between tests.
  pausedStore.refresh()
})

describe("pausedStore", () => {
  it("starts empty", () => {
    expect(pausedStore.getSnapshot()).toEqual([])
  })

  it("remembers and forgets ids", () => {
    pausedStore.remember(101)
    pausedStore.remember(202)
    expect(pausedStore.getSnapshot()).toEqual([101, 202])

    pausedStore.forget(101)
    expect(pausedStore.getSnapshot()).toEqual([202])
  })

  it("does not duplicate an id remembered twice", () => {
    pausedStore.remember(101)
    expect(pausedStore.remember(101)).toEqual([101])
  })

  it("replaces the set on reconcile", () => {
    // Used when a subscription turns out to be active again — resumed from
    // another device, or returned by a fixed backend.
    pausedStore.remember(101)
    pausedStore.remember(202)

    pausedStore.reconcile([202])
    expect(pausedStore.getSnapshot()).toEqual([202])
  })

  it("keeps the same reference when nothing changed", () => {
    // useSyncExternalStore re-renders on every new reference, and the query key
    // is derived from this array — an unstable snapshot would loop.
    pausedStore.remember(101)
    const first = pausedStore.getSnapshot()

    expect(pausedStore.reconcile([101])).toBe(first)
    expect(pausedStore.getSnapshot()).toBe(first)
  })

  it("notifies subscribers only on a real change", () => {
    const listener = vi.fn()
    const unsubscribe = pausedStore.subscribe(listener)

    pausedStore.remember(101)
    expect(listener).toHaveBeenCalledTimes(1)

    pausedStore.remember(101)
    expect(listener).toHaveBeenCalledTimes(1)

    pausedStore.forget(101)
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    pausedStore.remember(303)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("returns an empty snapshot on the server", () => {
    expect(pausedStore.getServerSnapshot()).toEqual([])
  })

  it("survives corrupted storage", () => {
    window.localStorage.setItem(KEY, "not json")
    expect(pausedStore.refresh()).toEqual([])
  })

  it("ignores non-numeric entries", () => {
    window.localStorage.setItem(KEY, JSON.stringify([1, "two", null, 3]))
    expect(pausedStore.refresh()).toEqual([1, 3])
  })

  it("ignores a stored value that is not an array", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ a: 1 }))
    expect(pausedStore.refresh()).toEqual([])
  })
})

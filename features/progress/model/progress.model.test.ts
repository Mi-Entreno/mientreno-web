import { describe, expect, it } from "vitest"

import type { ProgressResponseDTO } from "../dto/progress.dto"
import { toProgressEntry } from "../mappers/progress.mapper"
import { availableMeasures, deltaOf, toSeries, type ProgressEntry } from "./progress.model"

function entry(overrides: Partial<ProgressResponseDTO>): ProgressEntry {
  return toProgressEntry({
    id: 1,
    subscriptionId: 101,
    weightKg: null,
    bodyFatPct: null,
    chestCm: null,
    waistCm: null,
    hipsCm: null,
    armsCm: null,
    thighsCm: null,
    photoUrl: null,
    notes: null,
    recordedAt: "2026-07-01T08:00:00Z",
    createdAt: "2026-07-01T08:05:00",
    ...overrides,
  })
}

// Newest first, as `findBySubscriptionIdOrderByRecordedAtDesc` returns them.
const ENTRIES: ProgressEntry[] = [
  entry({ id: 3, weightKg: 78, waistCm: 82, recordedAt: "2026-07-20T08:00:00Z" }),
  entry({ id: 2, weightKg: 80, recordedAt: "2026-07-10T08:00:00Z" }),
  entry({ id: 1, weightKg: 82, waistCm: 88, recordedAt: "2026-07-01T08:00:00Z" }),
]

describe("toSeries", () => {
  it("re-sorts oldest first, since the API returns newest first", () => {
    const series = toSeries(ENTRIES, "weightKg")
    expect(series.map((point) => point.value)).toEqual([82, 80, 78])
  })

  it("skips entries missing that measure instead of plotting zero", () => {
    // The middle entry has no waist measurement; plotting it as 0 would draw a
    // cliff that never happened.
    const series = toSeries(ENTRIES, "waistCm")

    expect(series.map((point) => point.value)).toEqual([88, 82])
    expect(series).toHaveLength(2)
  })

  it("returns an empty series when nothing was measured", () => {
    expect(toSeries(ENTRIES, "hipsCm")).toEqual([])
  })

  it("drops entries with an unparseable date", () => {
    const broken = [entry({ id: 9, weightKg: 70, recordedAt: "no es una fecha" })]
    expect(toSeries(broken, "weightKg")).toEqual([])
  })
})

describe("availableMeasures", () => {
  it("offers only measures some entry actually carries", () => {
    expect(availableMeasures(ENTRIES).map((measure) => measure.key)).toEqual([
      "weightKg",
      "waistCm",
    ])
  })

  it("returns nothing for an empty history", () => {
    expect(availableMeasures([])).toEqual([])
  })
})

describe("deltaOf", () => {
  it("compares first against last", () => {
    const delta = deltaOf(toSeries(ENTRIES, "weightKg"))

    expect(delta).toMatchObject({ first: 82, last: 78, change: -4 })
    expect(delta?.percent).toBeCloseTo(-4.9, 1)
  })

  it("has no percentage for a single point", () => {
    const single = toSeries([ENTRIES[0]], "weightKg")
    expect(deltaOf(single)).toMatchObject({ change: 0, percent: null })
  })

  it("returns null for an empty series", () => {
    expect(deltaOf([])).toBeNull()
  })
})

describe("toProgressEntry", () => {
  it("routes the photo through the media proxy", () => {
    const mapped = entry({ photoUrl: "http://localhost:8080/api/files/progress/1/front.jpg" })
    expect(mapped.photoUrl).toBe("/api/media/progress/1/front.jpg")
  })

  it("keeps a zero measurement distinct from a missing one", () => {
    const mapped = entry({ bodyFatPct: 0 })

    expect(mapped.bodyFatPct).toBe(0)
    expect(mapped.weightKg).toBeNull()
  })
})

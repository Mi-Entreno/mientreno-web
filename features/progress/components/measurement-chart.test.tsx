import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { measureOf, toSeries } from "../model/progress.model"
import type { ProgressEntry } from "../model/progress.model"
import { MeasurementChart } from "./measurement-chart"

/**
 * Geometry checks on the real rendered SVG.
 *
 * The palette validator covers colour; it says nothing about layout. These
 * assertions stand in for "render it and look at it" on the things that can be
 * decided numerically — marks inside the plot box, labels not overflowing the
 * viewBox, axis text fitting its gutter.
 */
const VIEW_W = 720
const VIEW_H = 260
const PAD = { top: 16, right: 56, bottom: 28, left: 44 }

function entries(values: { value: number; date: string }[]): ProgressEntry[] {
  return values.map((item, index) => ({
    id: index + 1,
    subscriptionId: 101,
    weightKg: item.value,
    bodyFatPct: null,
    chestCm: null,
    waistCm: null,
    hipsCm: null,
    armsCm: null,
    thighsCm: null,
    photoUrl: null,
    notes: "",
    recordedAt: item.date,
    createdAt: item.date,
  }))
}

function renderChart(data: ProgressEntry[]) {
  const points = toSeries(data, "weightKg")
  const { container } = render(
    <MeasurementChart points={points} measure={measureOf("weightKg")} />,
  )
  return container.querySelector("svg")
}

const SAMPLE = entries([
  { value: 82, date: "2026-06-20T08:00:00Z" },
  { value: 80.1, date: "2026-07-04T08:00:00Z" },
  { value: 79, date: "2026-07-11T08:00:00Z" },
  { value: 77.4, date: "2026-07-25T08:00:00Z" },
])

describe("MeasurementChart geometry", () => {
  it("keeps every plotted point inside the plot box", () => {
    const svg = renderChart(SAMPLE)
    const path = svg?.querySelector("path")?.getAttribute("d") ?? ""

    const coords = [...path.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }))

    expect(coords).toHaveLength(4)
    for (const coord of coords) {
      expect(coord.x).toBeGreaterThanOrEqual(PAD.left)
      expect(coord.x).toBeLessThanOrEqual(VIEW_W - PAD.right)
      expect(coord.y).toBeGreaterThanOrEqual(PAD.top)
      expect(coord.y).toBeLessThanOrEqual(VIEW_H - PAD.bottom)
    }
  })

  it("leaves room for the endpoint label inside the viewBox", () => {
    // The right padding exists precisely so the direct label is not clipped.
    const svg = renderChart(SAMPLE)
    const labels = [...(svg?.querySelectorAll("text") ?? [])]
    const endLabel = labels.find((node) => node.textContent === "77.4")

    expect(endLabel).toBeTruthy()
    const x = Number(endLabel?.getAttribute("x"))
    // ~7px per character at 12px — a 5-char label must still fit.
    expect(x + 5 * 7).toBeLessThanOrEqual(VIEW_W)
  })

  it("fits the y-axis tick labels in the left gutter", () => {
    const svg = renderChart(SAMPLE)
    const ticks = [...(svg?.querySelectorAll("text") ?? [])].filter(
      (node) => node.getAttribute("text-anchor") === "end" && node.getAttribute("x") === "36",
    )

    expect(ticks.length).toBeGreaterThan(0)
    for (const tick of ticks) {
      // Anchored at PAD.left - 8 = 36, growing leftwards; 4 chars must fit.
      expect(36 - (tick.textContent?.length ?? 0) * 7).toBeGreaterThanOrEqual(0)
    }
  })

  it("uses a 2px line with round caps, per the mark spec", () => {
    const svg = renderChart(SAMPLE)
    const path = svg?.querySelector("path")

    expect(path?.getAttribute("stroke-width")).toBe("2")
    expect(path?.getAttribute("stroke-linecap")).toBe("round")
    expect(path?.getAttribute("fill")).toBe("none")
  })

  it("gives the end marker a 9px diameter and a 2px surface ring", () => {
    const svg = renderChart(SAMPLE)
    const marker = svg?.querySelector("circle")

    expect(Number(marker?.getAttribute("r"))).toBeGreaterThanOrEqual(4)
    expect(marker?.getAttribute("stroke")).toBe("var(--card)")
    expect(marker?.getAttribute("stroke-width")).toBe("2")
  })

  it("labels exactly one point, never every point", () => {
    // A value beside every dot is chaos and goes unread.
    //
    // Matching on the text alone is not enough: a y-axis tick can read the same
    // number as a data point. The direct label is the bold one.
    const svg = renderChart(SAMPLE)
    const valueLabels = [...(svg?.querySelectorAll("text") ?? [])].filter(
      (node) => node.getAttribute("font-weight") === "600",
    )

    expect(valueLabels).toHaveLength(1)
    expect(valueLabels[0].textContent).toBe("77.4")
  })

  it("centres a lone reading instead of pinning it to the left edge", () => {
    const svg = renderChart(entries([{ value: 80, date: "2026-07-01T08:00:00Z" }]))
    const path = svg?.querySelector("path")?.getAttribute("d") ?? ""
    const x = Number(/M([\d.]+)/.exec(path)?.[1])

    expect(x).toBeCloseTo(PAD.left + (VIEW_W - PAD.left - PAD.right) / 2, 0)
  })

  it("still renders when every reading is identical", () => {
    // A flat series has a zero value span; the tick maths must not divide by 0.
    const svg = renderChart(
      entries([
        { value: 80, date: "2026-07-01T08:00:00Z" },
        { value: 80, date: "2026-07-08T08:00:00Z" },
      ]),
    )
    const path = svg?.querySelector("path")?.getAttribute("d") ?? ""
    const ys = [...path.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]))

    expect(ys).toHaveLength(2)
    for (const y of ys) expect(Number.isFinite(y)).toBe(true)
  })

  it("shows an empty state rather than an axis with no data", () => {
    const { container } = render(
      <MeasurementChart points={[]} measure={measureOf("weightKg")} />,
    )

    expect(container.querySelector("svg")).toBeNull()
    expect(container.textContent).toContain("Sin datos")
  })
})

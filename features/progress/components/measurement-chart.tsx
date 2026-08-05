"use client"

import { useMemo, useRef, useState } from "react"

import { formatDate } from "@/lib/format"
import type { MeasureDefinition, SeriesPoint } from "../model/progress.model"

/**
 * Weight-over-time (or any single measurement) as a line chart.
 *
 * Form: trend over time, **one series** — so no legend box; the heading names
 * what is plotted. Colour is the project's own `--primary-text` green
 * (`#0b7a5d`), which passes the palette checks on the card surface (lightness
 * band, chroma floor, ≥3:1 contrast). Using the design system's own hue keeps
 * the chart from looking imported.
 *
 * Light-only on purpose: the app declares `colorScheme: 'light'` and ships no
 * dark tokens, so dark steps would never render.
 */
const VIEW_W = 720
const VIEW_H = 260
const PAD = { top: 16, right: 56, bottom: 28, left: 44 }

const PLOT_W = VIEW_W - PAD.left - PAD.right
const PLOT_H = VIEW_H - PAD.top - PAD.bottom

interface MeasurementChartProps {
  points: SeriesPoint[]
  measure: MeasureDefinition
}

export function MeasurementChart({ points, measure }: MeasurementChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const scale = useMemo(() => buildScale(points), [points])

  if (points.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-body text-muted-foreground">
        Sin datos de {measure.label.toLowerCase()} todavía.
      </p>
    )
  }

  const coords = points.map((point, index) => ({
    x: scale.x(point.time, index),
    y: scale.y(point.value),
    point,
  }))

  const path = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x} ${coord.y}`)
    .join(" ")

  const last = coords[coords.length - 1]
  const active = activeIndex !== null ? coords[activeIndex] : null

  /** Nearest point on the X axis — readers aim at a date, not a 2px line. */
  function handlePointer(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * VIEW_W

    let nearest = 0
    let best = Infinity
    coords.forEach((coord, index) => {
      const distance = Math.abs(coord.x - x)
      if (distance < best) {
        best = distance
        nearest = index
      }
    })

    setActiveIndex(nearest)
  }

  function handleKey(event: React.KeyboardEvent<SVGSVGElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()

    const step = event.key === "ArrowRight" ? 1 : -1
    const current = activeIndex ?? coords.length - 1
    setActiveIndex(Math.min(coords.length - 1, Math.max(0, current + step)))
  }

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full touch-none rounded-xl border border-border bg-card focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          role="img"
          tabIndex={0}
          aria-label={`Evolución de ${measure.label} en ${measure.unit}. Usa las flechas para recorrer los puntos.`}
          onPointerMove={handlePointer}
          onPointerLeave={() => setActiveIndex(null)}
          onKeyDown={handleKey}
          onBlur={() => setActiveIndex(null)}
        >
          {/* Gridlines: hairline, solid, one step off the surface. */}
          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={PAD.left + PLOT_W}
                y1={scale.y(tick)}
                y2={scale.y(tick)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={scale.y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Crosshair, behind the mark so it never covers the dot. */}
          {active && (
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--border-dark)"
              strokeWidth={1}
            />
          )}

          <path
            d={path}
            fill="none"
            stroke="#0b7a5d"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* End marker: 9px, with a 2px surface ring so it reads over the line. */}
          <circle cx={last.x} cy={last.y} r={4.5} fill="#0b7a5d" stroke="var(--card)" strokeWidth={2} />

          {active && active !== last && (
            <circle
              cx={active.x}
              cy={active.y}
              r={4.5}
              fill="#0b7a5d"
              stroke="var(--card)"
              strokeWidth={2}
            />
          )}

          {/* One direct label, on the endpoint — never a number on every point. */}
          <text
            x={last.x + 10}
            y={last.y}
            dominantBaseline="middle"
            className="fill-foreground"
            fontSize={12}
            fontWeight={600}
          >
            {last.point.value}
          </text>

          <text
            x={PAD.left}
            y={VIEW_H - 8}
            className="fill-muted-foreground"
            fontSize={11}
          >
            {formatDate(points[0].recordedAt)}
          </text>
          {points.length > 1 && (
            <text
              x={PAD.left + PLOT_W}
              y={VIEW_H - 8}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {formatDate(points[points.length - 1].recordedAt)}
            </text>
          )}
        </svg>

        {active && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-sm"
            style={{
              left: `${(active.x / VIEW_W) * 100}%`,
              transform: active.x > VIEW_W / 2 ? "translateX(-100%)" : "none",
            }}
          >
            {/* Value leads, label follows: the reader already knows the series. */}
            <p className="text-body font-semibold">
              {active.point.value} {measure.unit}
            </p>
            <p className="text-caption text-muted-foreground">
              {formatDate(active.point.recordedAt)}
            </p>
          </div>
        )}
      </div>

      <figcaption className="text-caption text-muted-foreground">
        {measure.label} en {measure.unit} · {points.length}{" "}
        {points.length === 1 ? "registro" : "registros"}. Los valores exactos están en la tabla de
        abajo.
      </figcaption>
    </figure>
  )
}

interface Scale {
  x: (time: number, index: number) => number
  y: (value: number) => number
  ticks: number[]
}

function buildScale(points: SeriesPoint[]): Scale {
  if (points.length === 0) {
    return { x: () => PAD.left, y: () => PAD.top, ticks: [] }
  }

  const times = points.map((point) => point.time)
  const values = points.map((point) => point.value)

  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const timeSpan = maxTime - minTime

  const ticks = niceTicks(Math.min(...values), Math.max(...values))
  const minTick = ticks[0]
  const maxTick = ticks[ticks.length - 1]
  const valueSpan = maxTick - minTick || 1

  return {
    // A single point, or several on the same day, sits centred rather than
    // collapsing onto the left edge.
    x: (time, index) =>
      timeSpan === 0
        ? PAD.left + PLOT_W * (points.length === 1 ? 0.5 : index / (points.length - 1))
        : PAD.left + ((time - minTime) / timeSpan) * PLOT_W,
    y: (value) => PAD.top + PLOT_H - ((value - minTick) / valueSpan) * PLOT_H,
    ticks,
  }
}

/** Round tick values so the axis reads 70 / 72 / 74, never 71.3333. */
function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.05)
    min -= pad
    max += pad
  }

  const rawStep = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? magnitude

  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step

  const ticks: number[] = []
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100)
  }
  return ticks
}

"use client"

import { Star } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import type { RatingDistribution } from "../model/directory.model"

/**
 * Rating breakdown, 5★ down to 1★.
 *
 * Form: compare magnitude across an ordered scale → horizontal bars, **one
 * series**, so a single hue and no legend. Colour is the project's own
 * `--primary-text` green, the same validated step the progress chart uses.
 *
 * Every bar is directly labelled with its count, so the hover layer adds the
 * one thing the labels do not carry — the share — rather than repeating them.
 */
export function RatingDistributionChart({ data }: { data: RatingDistribution }) {
  const [hovered, setHovered] = useState<number | null>(null)

  const max = Math.max(...data.buckets.map((bucket) => bucket.count), 1)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline gap-3">
        <p className="text-title font-semibold tracking-tight">
          {data.avgRating === null ? "—" : data.avgRating.toFixed(1)}
        </p>
        <p className="flex items-center gap-1 text-body text-muted-foreground">
          <Star className="size-4" />
          {data.totalReviews} {data.totalReviews === 1 ? "reseña" : "reseñas"}
        </p>
      </div>

      {data.totalReviews === 0 ? (
        <p className="text-body text-muted-foreground">
          Aún no tienes reseñas. Aparecerán aquí cuando tus alumnos te valoren.
        </p>
      ) : (
        // 2px gap between adjacent bars, done with the surface rather than a
        // stroke around each mark.
        <ul className="flex flex-col gap-0.5">
          {data.buckets.map((bucket) => (
            <li
              key={bucket.stars}
              className="flex items-center gap-3 rounded py-0.5"
              onPointerEnter={() => setHovered(bucket.stars)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(bucket.stars)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            >
              <span className="w-8 shrink-0 text-right text-body text-muted-foreground tabular-nums">
                {bucket.stars}★
              </span>

              <div className="h-4 flex-1 overflow-hidden rounded-sm bg-secondary">
                {/* Square at the baseline, 4px rounded at the data end. */}
                <div
                  className={cn(
                    "h-full rounded-r transition-[width] duration-300",
                    bucket.count === 0 && "opacity-0",
                  )}
                  style={{
                    width: `${(bucket.count / max) * 100}%`,
                    backgroundColor: "#0b7a5d",
                  }}
                />
              </div>

              {/* Direct label: the count. The share only appears on hover. */}
              <span className="w-16 shrink-0 text-body tabular-nums">
                {hovered === bucket.stars && data.totalReviews > 0 ? (
                  <span className="text-muted-foreground">{bucket.percent}%</span>
                ) : (
                  bucket.count
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

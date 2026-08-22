"use client"

import { LineChart, TrendingDown, TrendingUp } from "lucide-react"
import { useMemo, useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useProgressHistory } from "../hooks/use-progress"
import {
  MEASURES,
  availableMeasures,
  deltaOf,
  measureOf,
  toSeries,
  type MeasureKey,
  type ProgressEntry,
} from "../model/progress.model"
import { MeasurementChart } from "./measurement-chart"
import { ProgressDetailSheet } from "./progress-detail-sheet"

/**
 * A student's physical progress: one measurement plotted over time, plus the
 * full history as a table.
 *
 * The table is not decoration — it is the accessible route to every value the
 * chart only shows on hover.
 */
export function ProgressTab({ subscriptionId }: { subscriptionId: number }) {
  const { data, isLoading, isError, error, refetch } = useProgressHistory(subscriptionId)
  const [measureKey, setMeasureKey] = useState<MeasureKey>("weightKg")
  const [detailId, setDetailId] = useState<number | null>(null)

  const entries = useMemo(() => data ?? [], [data])
  const offered = useMemo(() => availableMeasures(entries), [entries])
  const measure = measureOf(measureKey)
  const points = useMemo(() => toSeries(entries, measureKey), [entries, measureKey])
  const delta = deltaOf(points)

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={LineChart}
        title="Este alumno aún no ha registrado progreso"
        description="Cuando anote su peso o sus medidas desde la aplicación, aparecerán aquí."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filters in one row above the chart. */}
      <div className="flex flex-wrap items-center gap-2">
        {offered.map((option) => {
          const active = option.key === measureKey
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => setMeasureKey(option.key)}
              className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Badge variant={active ? "default" : "secondary"} className="cursor-pointer">
                {option.label}
              </Badge>
            </button>
          )
        })}
      </div>

      {delta && points.length > 1 && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-title font-semibold tracking-tight">
            {delta.last} <span className="text-body font-normal text-muted-foreground">{measure.unit}</span>
          </p>
          <p
            className={cn(
              "flex items-center gap-1 text-body",
              delta.change === 0 ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {delta.change > 0 ? (
              <TrendingUp className="size-4" />
            ) : delta.change < 0 ? (
              <TrendingDown className="size-4" />
            ) : null}
            {delta.change > 0 ? "+" : ""}
            {delta.change} {measure.unit}
            {delta.percent !== null && (
              <span className="text-muted-foreground">
                ({delta.percent > 0 ? "+" : ""}
                {delta.percent}%)
              </span>
            )}
            <span className="text-muted-foreground">desde {formatDate(points[0].recordedAt)}</span>
          </p>
        </div>
      )}

      <MeasurementChart points={points} measure={measure} />

      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-subtitle font-semibold tracking-tight">Historial</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                {MEASURES.map((item) => (
                  <TableHead key={item.key} className="text-right">
                    {item.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <ProgressRow key={entry.id} entry={entry} onOpen={() => setDetailId(entry.id)} />
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <ProgressDetailSheet
        entryId={detailId}
        initial={entries.find((entry) => entry.id === detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  )
}

function ProgressRow({ entry, onOpen }: { entry: ProgressEntry; onOpen: () => void }) {
  return (
    <TableRow
      tabIndex={0}
      role="button"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
      className="cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <TableCell className="font-medium whitespace-nowrap">
        {formatDate(entry.recordedAt)}
      </TableCell>
      {MEASURES.map((measure) => {
        const value = entry[measure.key]
        return (
          <TableCell key={measure.key} className="text-right text-muted-foreground">
            {value === null ? "—" : value}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

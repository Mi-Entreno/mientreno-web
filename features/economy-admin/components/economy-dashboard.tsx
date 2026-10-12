"use client"

import { useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { OptionGroup } from "@/components/shared/option-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useEconomyMetrics } from "../hooks/use-economy-admin"
import {
  formatDecimal,
  formatMonth,
  formatPercent,
  formatReps,
  monthsToAfford,
  simulate,
  type EconomyConfig,
  type EconomyMetrics,
} from "../model/economy-admin.model"

/*
 * Chart colours: the `--viz-*` slots in globals.css (light only — the
 * dashboard has no dark theme). Emitted/spent are slots 1–2; the three profiles
 * are 3/1/4. Slot 3 sits under 3:1 against the card, so every segment carries
 * its number and the table repeats the values.
 */
const EARNED = "var(--viz-1)"
const SPENT = "var(--viz-2)"
const PROFILE_COLORS = { occasional: "var(--viz-3)", constant: "var(--viz-1)", active: "var(--viz-4)" } as const

const RANGES = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
] as const

/**
 * How the economy is actually going: the "reserve for accumulated points" the
 * model asks for (emitted, spent, outstanding), and the real distribution of
 * students per profile to compare against the 6/2/2 hypothesis.
 */
export function EconomyDashboard({ config }: { config: EconomyConfig }) {
  const [months, setMonths] = useState<"3" | "6" | "12">("6")
  const metrics = useEconomyMetrics(Number(months))

  if (metrics.isError) return <ErrorState error={metrics.error} onRetry={() => metrics.refetch()} />
  if (!metrics.data) return <Skeleton className="h-96 rounded-2xl" />
  const m = metrics.data
  const thisMonth = m.months[m.months.length - 1]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-muted-foreground">
          Economía versión {m.versionNo} · actualizado {new Date(m.generatedAt).toLocaleString("es-AR")}
        </p>
        <OptionGroup name="economy-range" label="Período" options={RANGES} value={months} onChange={setMonths} />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Repes pendientes"
          value={formatReps(m.totals.outstandingBalance)}
          hint={`En ${formatReps(m.totals.wallets)} billeteras, sin gastar`}
        />
        <Stat label="Emitidas (histórico)" value={formatReps(m.totals.lifetimeEarned)} />
        <Stat label="Gastadas (histórico)" value={formatReps(m.totals.lifetimeSpent)} />
        <Stat
          label="Desbloqueos este mes"
          value={formatReps(thisMonth?.unlocks ?? 0)}
          hint={`Tope: ${config.challenges.maxPerMonth} por alumno`}
        />
      </section>

      <Reachability metrics={m} config={config} />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">Emitidas y gastadas por mes</h2>
        <FlowChart metrics={m} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">Alumnos por perfil</h2>
        <p className="max-w-prose text-caption text-muted-foreground">
          Según repes ganadas en el mes (entrenar, reglas y ruleta): ocasional hasta{" "}
          {formatReps(m.profileThresholds.occasionalMaxReps)}, muy activo desde{" "}
          {formatReps(m.profileThresholds.activeMinReps)}. La hipótesis del modelo es 6 / 2 / 2 de cada 10.
        </p>
        <ProfilesChart metrics={m} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">De dónde salieron las repes este mes</h2>
        <SourcesChart metrics={m} />
      </section>
    </div>
  )
}

function Reachability({ metrics, config }: { metrics: EconomyMetrics; config: EconomyConfig }) {
  const cost = metrics.reachability.minChallengeCost
  if (cost === null) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-4 text-body text-muted-foreground">
        No hay desafíos publicados con costo en repes: todavía no hay umbral de canje para medir.
      </p>
    )
  }
  const share = metrics.totals.wallets > 0 ? metrics.reachability.walletsAtOrAboveMin / metrics.totals.wallets : 0
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <p className="text-body">
        El desafío publicado más barato cuesta <strong>{formatReps(cost)} repes</strong>.{" "}
        {formatReps(metrics.reachability.walletsAtOrAboveMin)} alumnos ({formatPercent(share)}) ya pueden pagarlo.
      </p>
      <ul className="grid gap-2 text-caption text-muted-foreground sm:grid-cols-3">
        {simulate(config).map((s) => {
          const months = monthsToAfford(cost, s.total)
          return (
            <li key={s.profile.id}>
              {s.profile.label}: {months === null ? "no llega" : `~${formatDecimal(months)} meses`} (simulado)
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Grouped bars per month: emitted vs spent. One axis, both in reps. */
function FlowChart({ metrics }: { metrics: EconomyMetrics }) {
  const max = Math.max(1, ...metrics.months.flatMap((month) => [month.earned, month.spent]))
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <Legend items={[{ label: "Emitidas", color: EARNED }, { label: "Gastadas", color: SPENT }]} />
      <div className="flex h-48 items-end gap-3" role="img" aria-label="Repes emitidas y gastadas por mes">
        {metrics.months.map((month) => (
          <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              <Bar value={month.earned} max={max} color={EARNED} title={`${formatMonth(month.month)} · emitidas: ${formatReps(month.earned)}`} />
              <Bar value={month.spent} max={max} color={SPENT} title={`${formatMonth(month.month)} · gastadas: ${formatReps(month.spent)}`} />
            </div>
            <span className="truncate text-caption text-muted-foreground">{formatMonth(month.month)}</span>
          </div>
        ))}
      </div>
      <table className="w-full text-caption">
        <caption className="sr-only">Detalle por mes</caption>
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-1 font-medium">Mes</th>
            <th className="py-1 text-right font-medium">Emitidas</th>
            <th className="py-1 text-right font-medium">Gastadas</th>
            <th className="py-1 text-right font-medium">Reintegros</th>
            <th className="py-1 text-right font-medium">Mediana / alumno</th>
            <th className="py-1 text-right font-medium">P90 / alumno</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {metrics.months.map((month) => (
            <tr key={month.month} className="border-t border-border">
              <td className="py-1">{formatMonth(month.month)}</td>
              <td className="py-1 text-right">{formatReps(month.earned)}</td>
              <td className="py-1 text-right">{formatReps(month.spent)}</td>
              <td className="py-1 text-right">{formatReps(month.refunded)}</td>
              <td className="py-1 text-right">{formatDecimal(month.medianEarned)}</td>
              <td className="py-1 text-right">{formatDecimal(month.p90Earned)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Bar({ value, max, color, title }: { value: number; max: number; color: string; title: string }) {
  return (
    <div className="group relative flex h-full w-full max-w-6 items-end" title={title}>
      <div
        className="w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
        style={{ height: value > 0 ? `max(2px, ${(value / max) * 100}%)` : 0, backgroundColor: color }}
      />
    </div>
  )
}

/** One 100 % stacked bar per month, plus the hypothesis as a reference row. */
function ProfilesChart({ metrics }: { metrics: EconomyMetrics }) {
  const rows = [
    { key: "hipotesis", label: "Hipótesis", occasional: 6, constant: 2, active: 2, earners: 10, hypothesis: true },
    ...metrics.months.map((month) => ({
      key: month.month,
      label: formatMonth(month.month),
      occasional: month.occasional,
      constant: month.constant,
      active: month.active,
      earners: month.earners,
      hypothesis: false,
    })),
  ]
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <Legend
        items={[
          { label: "Ocasional", color: PROFILE_COLORS.occasional },
          { label: "Constante", color: PROFILE_COLORS.constant },
          { label: "Muy activo", color: PROFILE_COLORS.active },
        ]}
      />
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.key} className="grid grid-cols-[88px_minmax(0,1fr)_64px] items-center gap-3 text-caption">
            <span className={row.hypothesis ? "font-medium" : "text-muted-foreground"}>{row.label}</span>
            {row.earners === 0 ? (
              <span className="text-muted-foreground">Sin alumnos que hayan ganado repes</span>
            ) : (
              <div className="flex h-5 gap-0.5 overflow-hidden rounded-[4px]">
                {(["occasional", "constant", "active"] as const).map((profile) =>
                  row[profile] > 0 ? (
                    <div
                      key={profile}
                      className="flex items-center justify-center text-caption font-medium text-white"
                      style={{ width: `${(row[profile] / row.earners) * 100}%`, backgroundColor: PROFILE_COLORS[profile] }}
                      title={`${row.label} · ${profile === "occasional" ? "Ocasional" : profile === "constant" ? "Constante" : "Muy activo"}: ${row[profile]}`}
                    >
                      {row[profile]}
                    </div>
                  ) : null,
                )}
              </div>
            )}
            <span className="text-right tabular-nums text-muted-foreground">
              {row.hypothesis ? "de 10" : `${formatReps(row.earners)} alumnos`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SourcesChart({ metrics }: { metrics: EconomyMetrics }) {
  const credits = metrics.creditsThisMonth
  if (credits.length === 0) return <p className="text-body text-muted-foreground">Todavía no se acreditó nada este mes.</p>
  const max = Math.max(...credits.map((c) => c.reps))
  return (
    <ul className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
      {credits.map((credit) => (
        <li key={credit.source} className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)_64px] items-center gap-3 text-caption">
          <span className="truncate">{credit.label}</span>
          <div className="h-3 rounded-r-[4px] bg-muted">
            <div className="h-3 rounded-r-[4px]" style={{ width: `${(credit.reps / max) * 100}%`, backgroundColor: EARNED }} />
          </div>
          <span className="text-right tabular-nums">{formatReps(credit.reps)}</span>
        </li>
      ))}
    </ul>
  )
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-caption text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-subtitle font-semibold">{value}</p>
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}

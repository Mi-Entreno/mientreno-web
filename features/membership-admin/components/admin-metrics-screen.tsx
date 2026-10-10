"use client"

import { ErrorState } from "@/components/dashboard/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { STATUS_LABELS, type MembershipStatus } from "@/features/membership/model/membership.model"
import { formatCurrency } from "@/lib/format"
import { useMembershipMetrics } from "../hooks/use-membership-admin"
import { AUDIENCE_LABELS, percent, splitKey } from "../model/membership-admin.model"

const PROVIDER_LABELS: Record<string, string> = {
  MERCADO_PAGO: "Mercado Pago (web)",
  REVENUECAT: "Tiendas (App Store / Google Play)",
}

/**
 * How memberships are doing: recurring revenue, who pays, this month's movement
 * and the last 30 days of the funnel. Gross amounts: Mercado Pago's and the
 * stores' fees (15-30 %) are not discounted, which is why revenue is also split
 * by provider.
 */
export function AdminMetricsScreen() {
  const metrics = useMembershipMetrics()

  if (metrics.isError) return <ErrorState error={metrics.error} onRetry={() => metrics.refetch()} />
  if (!metrics.data) return <Skeleton className="h-96 rounded-2xl" />
  const m = metrics.data
  const ars = (record: Record<string, number>) => (record.ARS !== undefined ? formatCurrency(record.ARS) : "$ 0")

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="MRR" value={ars(m.mrr)} hint="Ingreso mensual recurrente (bruto)" />
        <Stat label="ARR" value={ars(m.arr)} hint="MRR × 12" />
        <Stat label="ARPU" value={ars(m.arpu)} hint="Por usuario que paga, por mes" />
        <Stat label="Churn del mes" value={percent(m.month.churnRate)} hint={`${m.month.paidChurn} bajas pagas`} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">Este mes</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Altas pagas" value={String(m.month.newPaid)} />
          <Stat label="Pruebas iniciadas" value={String(m.month.trialsStarted)} />
          <Stat label="Pruebas perdidas" value={String(m.month.trialsLost)} />
          <Stat label="Renovaciones" value={String(m.month.renewals)} />
          <Stat label="Cobros fallidos" value={String(m.month.failedPayments)} />
          <Stat label="Bajas pagas" value={String(m.month.paidChurn)} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">Quién paga</h2>
          <Table
            rows={Object.entries(m.payingByAudience).map(([audience, count]) => [
              AUDIENCE_LABELS[audience as keyof typeof AUDIENCE_LABELS] ?? audience,
              `${count} · conversión ${percent(m.conversion[audience])}`,
            ])}
            empty="Todavía nadie paga."
          />
          <Table
            rows={Object.entries(m.mrrByProvider).map(([key, value]) => {
              const [provider, currency] = splitKey(key)
              return [PROVIDER_LABELS[provider] ?? provider, `${formatCurrency(value)} ${currency}/mes`]
            })}
            empty="Sin ingresos recurrentes."
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">Membresías que dan acceso</h2>
          <Table
            rows={Object.entries(m.liveByPlan).map(([key, count]) => {
              const [plan, status] = splitKey(key)
              return [plan, `${STATUS_LABELS[status as MembershipStatus] ?? status}: ${count}`]
            })}
            empty="Ninguna."
          />
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">Embudo de los últimos 30 días</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Chocaron con un límite" value={String(m.funnel30Days.paywallHitUsers)} hint="usuarios" />
          <Stat label="Vieron el aviso" value={String(m.funnel30Days.paywallUsers)} hint="usuarios" />
          <Stat label="Abrieron Premium" value={String(m.funnel30Days.premiumPageUsers)} hint="usuarios" />
          <Stat label="Checkouts (web)" value={String(m.funnel30Days.checkouts)} />
          <Stat label="Activaciones" value={String(m.funnel30Days.activations)} />
        </div>
        {m.funnel30Days.notes.map((note) => (
          <p key={note} className="text-caption text-muted-foreground">{note}</p>
        ))}
      </section>
    </div>
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

function Table({ rows, empty }: { rows: [string, string][]; empty: string }) {
  if (rows.length === 0) return <p className="text-body text-muted-foreground">{empty}</p>
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {rows.map(([label, value]) => (
        <li key={label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-body">
          <span>{label}</span>
          <span className="text-muted-foreground">{value}</span>
        </li>
      ))}
    </ul>
  )
}

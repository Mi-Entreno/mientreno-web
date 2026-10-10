"use client"

import { Users } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { PremiumGate } from "@/features/membership/components/premium-gate"
import { FEATURES } from "@/features/membership/model/membership.model"
import { cn } from "@/lib/utils"
import { useAdherence } from "../hooks/use-adherence"
import { describeLastSession, describeRhythm, STATUS_LABELS, type AdherenceStatus } from "../model/adherence.model"

const STATUS_STYLES: Record<AdherenceStatus, string> = {
  FALLING_OFF: "bg-error-surface text-error-text border-error/40",
  AT_RISK: "bg-warning-surface text-warning-text border-warning",
  ON_TRACK: "bg-success-surface text-success-text border-success/40",
  NO_PLAN: "bg-secondary text-muted-foreground border-border",
}

/** Who trains and who is falling off, most in need of attention first (Pro). */
export function AdherenceScreen() {
  return (
    <PremiumGate feature={FEATURES.adherenceDashboard}>
      <AdherenceContent />
    </PremiumGate>
  )
}

function AdherenceContent() {
  const adherence = useAdherence()

  if (adherence.isError) return <ErrorState error={adherence.error} onRetry={() => adherence.refetch()} />
  if (!adherence.data) return <Skeleton className="h-64 rounded-2xl" />

  const { summary, students } = adherence.data
  if (students.length === 0) {
    return <EmptyState icon={Users} title="Todavía no tenés alumnos activos" description="Cuando tengas alumnos, vas a ver acá cómo vienen entrenando." />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Count label="Se están cayendo" value={summary.fallingOff} tone="FALLING_OFF" />
        <Count label="En riesgo" value={summary.atRisk} tone="AT_RISK" />
        <Count label="Al día" value={summary.onTrack} tone="ON_TRACK" />
        <Count label="Sin plan" value={summary.withoutPlan} tone="NO_PLAN" />
      </div>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {students.map((student) => (
          <li key={student.subscriptionId}>
            <Link
              href={`/dashboard/students/${student.subscriptionId}`}
              className="flex flex-col gap-1 px-5 py-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{student.studentName}</p>
                <p className="text-caption text-muted-foreground">
                  {describeRhythm(student)} · {describeLastSession(student.lastSessionDate)}
                </p>
              </div>
              <span className={cn("w-fit shrink-0 rounded-full border px-2.5 py-0.5 text-caption font-medium", STATUS_STYLES[student.status])}>
                {STATUS_LABELS[student.status]}
                {student.ratio !== null && ` · ${Math.round(student.ratio * 100)} %`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground text-pretty">
        Entrenamientos de las últimas 4 semanas contra los días del plan vigente. Diez días sin entrenar cuentan como
        &quot;se está cayendo&quot; aunque el mes haya ido bien.
      </p>
    </div>
  )
}

function Count({ label, value, tone }: { label: string; value: number; tone: AdherenceStatus }) {
  return (
    <div className={cn("rounded-2xl border p-4", STATUS_STYLES[tone])}>
      <p className="font-heading text-title font-semibold">{value}</p>
      <p className="text-caption">{label}</p>
    </div>
  )
}

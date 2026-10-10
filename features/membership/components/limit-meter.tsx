"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { useFeature } from "../hooks/use-membership"
import { describeUsage, limitUsage } from "../model/membership.model"

/**
 * "2 de 10 alumnos", with a bar. Renders nothing when the plan has no limit for
 * the feature — which is the case for every trainer until a limit is set — so
 * dropping it on a screen changes nothing until there is something to say.
 */
export function LimitMeter({ feature, className }: { feature: string; className?: string }) {
  const { feature: entitlement } = useFeature(feature)
  const usage = limitUsage(entitlement)
  if (!entitlement || !usage) return null

  return (
    <div className={cn("flex min-w-44 flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-3 text-caption">
        <span className={cn("font-medium", usage.exhausted ? "text-warning-text" : "text-foreground")}>
          {describeUsage(usage, entitlement.unit)}
        </span>
        {usage.nearLimit && (
          <Link href="/dashboard/plan" className="text-primary-text underline-offset-4 hover:underline">
            Ampliar
          </Link>
        )}
      </div>
      <div
        role="meter"
        aria-label={entitlement.name}
        aria-valuemin={0}
        aria-valuemax={usage.limit}
        aria-valuenow={usage.used}
        className="h-1.5 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className={cn("h-full rounded-full", usage.exhausted ? "bg-warning" : "bg-primary")}
          style={{ width: `${Math.round(usage.ratio * 100)}%` }}
        />
      </div>
    </div>
  )
}

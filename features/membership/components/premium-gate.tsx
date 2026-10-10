"use client"

import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

import { buttonVariants } from "@/components/ui/button"
import { track } from "@/core/analytics/track"
import { cn } from "@/lib/utils"
import { useFeature } from "../hooks/use-membership"

interface PremiumGateProps {
  /** Feature code, e.g. `FEATURES.planTemplates`. */
  feature: string
  children: React.ReactNode
  /** Replaces the default paywall card, e.g. a compact inline variant. */
  fallback?: React.ReactNode
}

/**
 * Shows `children` when the trainer's plan includes the feature, and explains
 * the benefit otherwise — never a bare lock.
 *
 * This is presentation only. The backend re-checks every action (402 if the
 * plan does not allow it), so hiding or forcing this component changes what is
 * painted, never what is allowed.
 *
 * While entitlements load, or if they fail, the children render: flashing a
 * paywall at a trainer who has the feature is worse than showing a button the
 * backend may still refuse, and the refusal is explained by `providers.tsx`.
 */
export function PremiumGate({ feature, children, fallback }: PremiumGateProps) {
  const { feature: entitlement, isLoading, isError } = useFeature(feature)

  if (isLoading || isError || !entitlement || entitlement.enabled) return <>{children}</>
  return <>{fallback ?? <PaywallCard featureCode={feature} name={entitlement.name} description={entitlement.description} />}</>
}

export function PaywallCard({
  featureCode,
  name,
  description,
}: {
  featureCode: string
  name: string
  description: string | null
}) {
  // Same code the server records on a 402, so the two ends of the funnel join.
  useEffect(() => track("PAYWALL_VIEWED", { feature: featureCode }), [featureCode])

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary-text">
        <Sparkles className="size-5" />
      </span>
      <div>
        <p className="font-medium">{name} es parte de Pro</p>
        <p className="mt-1 max-w-prose text-body text-muted-foreground text-pretty">
          {description ?? "Esta funcionalidad está disponible en un plan superior."}
        </p>
      </div>
      <Link href="/dashboard/plan" className={cn(buttonVariants({ size: "sm" }))}>
        Ver Pro
      </Link>
    </div>
  )
}

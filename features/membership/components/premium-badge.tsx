"use client"

import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { useEntitlements, useFeature } from "../hooks/use-membership"
import { FEATURES } from "../model/membership.model"

/**
 * The plan's badge ("Pro"), next to the trainer's name. Shown only when the
 * plan includes it (PREMIUM_BADGE), so the free plan renders nothing.
 */
export function PremiumBadge({ className }: { className?: string }) {
  const { feature } = useFeature(FEATURES.premiumBadge)
  const entitlements = useEntitlements()
  if (!feature?.enabled || !entitlements.data?.planName) return null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-caption font-semibold text-primary-text",
        className,
      )}
    >
      <Sparkles className="size-3" aria-hidden />
      {entitlements.data.planName}
    </span>
  )
}

"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useMyMembership } from "../hooks/use-membership"
import { describeMembership } from "../model/membership.model"

/**
 * The plan at a glance, from settings. Quiet on failure, like `BillingCard`: a
 * broken endpoint must not make settings look broken.
 */
export function MembershipCard() {
  const me = useMyMembership()
  const membership = me.data?.membership ?? null
  const isPaid = membership !== null && membership.status !== "PENDING"

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            isPaid ? "bg-primary/10 text-primary-text" : "bg-secondary text-muted-foreground",
          )}
        >
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          {me.isLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            <>
              <p className="font-medium">{membership?.planName ?? me.data?.effectivePlanName ?? "Gratis"}</p>
              <p className="mt-0.5 text-body text-muted-foreground text-pretty">
                {membership ? describeMembership(membership) : "Más alumnos, menos comisión y herramientas profesionales con Pro."}
              </p>
            </>
          )}
        </div>
      </div>
      <Link
        href="/dashboard/plan"
        className="flex w-fit items-center gap-1.5 text-body font-medium text-primary-text underline-offset-4 hover:underline"
      >
        {isPaid ? "Ver mi plan" : "Conocer Pro"}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

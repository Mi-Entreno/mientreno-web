"use client"

import { Loader2 } from "lucide-react"

import { ErrorState } from "@/components/dashboard/error-state"
import { OptionGroup, type Option } from "@/components/shared/option-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useUpdatePreferences, useUserPreferences } from "../hooks/use-user"
import type { OnboardingMode } from "../model/user.model"

/**
 * `GET` / `PUT /api/users/preferences`.
 *
 * The endpoint is often described as covering language and notifications, but
 * `UserPreferencesRequestDTO` has exactly one field — `onboardingMode`, an enum
 * of `OWN_PLAN | TRAINER_SEARCH`. There is nothing else to render until the
 * backend adds fields.
 *
 * It is a trainer-facing setting only in the sense that it belongs to the user
 * account; it drives how the mobile app routes a user on first launch.
 */
const MODES: readonly Option<OnboardingMode>[] = [
  {
    value: "OWN_PLAN",
    label: "Plan propio",
    description: "Entrena con planes que te creas tú mismo",
  },
  {
    value: "TRAINER_SEARCH",
    label: "Buscar entrenador",
    description: "Explora entrenadores y suscríbete a uno",
  },
]

export function PreferencesCard() {
  const { data, isLoading, isError, error, refetch } = useUserPreferences()
  const update = useUpdatePreferences()

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-xl" />
  }

  if (isError || !data) {
    return <ErrorState error={error} onRetry={() => refetch()} inline />
  }

  return (
    <div className="flex flex-col gap-3">
      <OptionGroup
        name="onboardingMode"
        label="Modo de onboarding"
        options={MODES}
        value={data.onboardingMode}
        disabled={update.isPending}
        onChange={(onboardingMode) => update.mutate({ onboardingMode })}
      />
      {update.isPending && (
        <p className="flex items-center gap-2 text-caption text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Guardando…
        </p>
      )}
    </div>
  )
}

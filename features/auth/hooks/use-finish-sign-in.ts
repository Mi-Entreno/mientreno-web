"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { toast } from "sonner"

import type { SignInResult } from "../api/auth.repository"
import { BRAND_AUDIENCE, TRAINER_AUDIENCE, type AudienceCopy } from "../model/audience"

/**
 * Where to go once a sign-in succeeded — shared by the password form and
 * "Continuar con Google / Apple", which answer the same `SignInResult`.
 *
 * Where the user ends up is **not** decided here — it comes back in `home`,
 * derived from the JWT by the route handler. Deciding it client-side would put
 * a second opinion next to the guard's, and two opinions about "which panel is
 * yours" is how you get a redirect loop.
 *
 * Unverified accounts are not handled: only the password path can produce one,
 * and it needs the typed email to send the user to the OTP screen.
 */
export function useFinishSignIn(audience: AudienceCopy | null) {
  const router = useRouter()
  const params = useSearchParams()

  return useCallback(
    (data: SignInResult) => {
      // Falls back to the audience's own home only if the field is missing,
      // which would mean an older BFF build.
      //
      // En la puerta neutra no hay audiencia de la cual sacar ese respaldo, así
      // que se usa el panel del entrenador. Es una conjetura que se corrige
      // sola: el guard rebota una sesión de comercio de `/dashboard` a
      // `/comercio` en la misma navegación.
      const home = data.home ?? audience?.homePrefix ?? TRAINER_AUDIENCE.homePrefix

      // Most of the API is unusable until the profile exists, and the route
      // guard enforces the same rule server-side. A trainer who just signed up
      // with Google lands here on their first visit.
      if (!data.profileCompleted) {
        router.push(`${profilePathFor(home, audience)}?complete=1`)
        router.refresh()
        return
      }

      toast.success(
        data.firstName ? `Bienvenido de nuevo, ${data.firstName}` : "Bienvenido de nuevo",
      )
      // `?from` is only honoured when it points inside the panel this session
      // actually owns: a merchant arriving with `from=/dashboard/students`
      // would otherwise be sent somewhere the guard bounces them out of.
      const from = params.get("from")
      router.push(from && from.startsWith(home) ? from : home)
      router.refresh()
    },
    [audience, params, router],
  )
}

/**
 * Onboarding path for the panel the session actually belongs to.
 *
 * Uses `home` and not the audience of the page: someone can sign in through the
 * trainer door with a merchant account, and sending them to the trainer's
 * profile form would strand them in a loop. En la puerta neutra no hay página de
 * la cual discrepar, y `home` es igual de suficiente.
 */
function profilePathFor(home: string, audience: AudienceCopy | null): string {
  if (home.startsWith(BRAND_AUDIENCE.homePrefix)) return BRAND_AUDIENCE.profilePath
  if (home.startsWith(TRAINER_AUDIENCE.homePrefix)) return TRAINER_AUDIENCE.profilePath
  return audience?.profilePath ?? TRAINER_AUDIENCE.profilePath
}

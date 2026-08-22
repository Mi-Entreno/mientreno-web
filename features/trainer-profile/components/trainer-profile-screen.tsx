"use client"

import { AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { PersonalDataForm } from "@/features/user/components/personal-data-form"
import { useUserProfile } from "@/features/user/hooks/use-user"
import {
  useCompleteTrainerProfile,
  useTrainerProfile,
  useUpdateTrainerProfile,
} from "../hooks/use-trainer-profile"
import { toFormValues } from "../mappers/trainer-profile.mapper"
import type {
  CompleteProfileIdentityValues,
  TrainerProfileFormValues,
} from "../model/trainer-profile.model"
import { ProfileStats } from "./profile-stats"
import { TrainerProfileForm } from "./trainer-profile-form"

const BLANK_FORM: TrainerProfileFormValues = {
  bio: "",
  basePrice: "",
  experienceYears: "",
  location: "",
  avatarPath: "",
  specialties: [],
  certifications: [],
}

/**
 * Drives the two states of `/dashboard/profile`.
 *
 * `GET /api/trainer/profile` answers 404 for a trainer who has not completed
 * onboarding — the repository turns that into `null`, which is the signal to
 * render the create form (`POST /complete`) instead of the edit form
 * (`PUT`). The route guard sends `?complete=1` for the same case, but the
 * absence of a profile is the authoritative check: the JWT claim can lag.
 */
export function TrainerProfileScreen() {
  const params = useSearchParams()
  const profile = useTrainerProfile()
  // Only needed to prefill the identity fields of the create form.
  const userProfile = useUserProfile()

  const update = useUpdateTrainerProfile()
  const complete = useCompleteTrainerProfile()

  const isCreating = profile.data === null
  const forcedByGuard = params.get("complete") === "1"

  const initialValues = useMemo<TrainerProfileFormValues>(
    () => (profile.data ? toFormValues(profile.data) : BLANK_FORM),
    [profile.data],
  )

  const initialIdentity = useMemo<CompleteProfileIdentityValues>(
    () => ({
      firstName: userProfile.data?.firstName ?? "",
      lastName: userProfile.data?.lastName ?? "",
      birthDate: userProfile.data?.birthDate ?? "",
      gender: userProfile.data?.gender ?? "",
      country: userProfile.data?.country ?? "",
    }),
    [userProfile.data],
  )

  if (profile.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (profile.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>No se ha podido cargar tu perfil</AlertTitle>
        <AlertDescription>
          Vuelve a intentarlo en unos instantes. Si el problema continúa, comprueba tu conexión.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {isCreating ? (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Completa tu perfil profesional</AlertTitle>
          <AlertDescription>
            {forcedByGuard
              ? "Necesitas un perfil profesional antes de gestionar alumnos y planes."
              : "Aún no has creado tu perfil profesional. Solo se crea una vez."}
          </AlertDescription>
        </Alert>
      ) : (
        profile.data && <ProfileStats profile={profile.data} />
      )}

      {/*
        Personal data used to live on /dashboard/settings, which meant a trainer
        edited "who I am" in one place and "what students see" in another —
        including two separate photo fields for the same person. Editing is all
        here now; settings keeps configuration and shortcuts.

        Hidden while creating, because `POST /complete` asks for the identity
        fields itself and the account form would be a second, conflicting copy.
      */}
      {!isCreating && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-subtitle font-semibold tracking-tight">
              Datos personales
            </h2>
            <p className="mt-1 text-body text-muted-foreground">
              Tu nombre y tus datos de contacto. El correo y el teléfono no se cambian desde acá.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <PersonalDataForm />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        {!isCreating && (
          <div>
            <h2 className="font-heading text-subtitle font-semibold tracking-tight">
              Perfil profesional
            </h2>
            <p className="mt-1 text-body text-muted-foreground">
              Tu foto, tu presentación y tus credenciales: esto es lo que ven tus alumnos.
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <TrainerProfileForm
          // Remounts when the mode flips, so the form reseeds from the new data.
          key={isCreating ? "complete" : "edit"}
          mode={isCreating ? "complete" : "edit"}
          initialValues={initialValues}
          initialIdentity={initialIdentity}
          isPending={update.isPending || complete.isPending}
          error={update.error ?? complete.error}
          onSubmit={(values, identity) => {
            if (isCreating) {
              complete.mutate({ values, identity })
            } else {
              update.mutate(values)
            }
          }}
        />
        </div>
      </section>
    </div>
  )
}

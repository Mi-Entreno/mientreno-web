"use client"

import { Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { ImageUrlField } from "@/components/shared/image-url-field"
import { GENDER_OPTIONS, OptionGroup } from "@/components/shared/option-group"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/core/http/errors"
import { useUpdateUserProfile, useUserProfile } from "../hooks/use-user"
import type { UserProfileFormValues } from "../mappers/user.mapper"
import type { UserProfile } from "../model/user.model"

/**
 * Personal account data — `GET` / `PUT /api/user-detail`.
 *
 * Separate from the professional profile on purpose: this is who the account
 * belongs to, while `/dashboard/profile` is what students see. The backend
 * splits them the same way.
 */
export function PersonalDataForm() {
  const { data, isLoading, isError, error, refetch } = useUserProfile()

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  if (isError || !data) {
    return (
      <ErrorState error={error} onRetry={() => refetch()} inline />
    )
  }

  // Keyed so the form reseeds if the profile is refetched from elsewhere.
  return <PersonalDataFields key={data.userId} profile={data} />
}

function PersonalDataFields({ profile }: { profile: UserProfile }) {
  const update = useUpdateUserProfile()

  const [values, setValues] = useState<UserProfileFormValues>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    birthDate: profile.birthDate,
    gender: profile.gender,
    country: profile.country,
    avatarPath: profile.avatarPath ?? "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Bean-validation 400s arrive as a field -> message map.
  const serverErrors = update.error instanceof ApiError ? update.error.fieldErrors : {}
  const allErrors = { ...serverErrors, ...errors }

  function patch(next: Partial<UserProfileFormValues>) {
    setValues((current) => ({ ...current, ...next }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const found: Record<string, string> = {}
    if (!values.firstName.trim()) found.firstName = "El nombre es obligatorio"
    if (!values.lastName.trim()) found.lastName = "Los apellidos son obligatorios"

    setErrors(found)
    if (Object.keys(found).length > 0) return

    update.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pd-firstName">
            Nombre <span className="text-error-text">*</span>
          </Label>
          <Input
            id="pd-firstName"
            value={values.firstName}
            disabled={update.isPending}
            onChange={(event) => patch({ firstName: event.target.value })}
          />
          {allErrors.firstName && <p className="text-body text-error-text">{allErrors.firstName}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pd-lastName">
            Apellidos <span className="text-error-text">*</span>
          </Label>
          <Input
            id="pd-lastName"
            value={values.lastName}
            disabled={update.isPending}
            onChange={(event) => patch({ lastName: event.target.value })}
          />
          {allErrors.lastName && <p className="text-body text-error-text">{allErrors.lastName}</p>}
        </div>

        {/*
          Read-only: `UserProfileUpdateRequestDTO` carries no email or phone
          field, so there is no way to change them through this endpoint.
        */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="pd-email">Correo electrónico</Label>
          <Input id="pd-email" value={profile.email} disabled readOnly />
          <p className="text-caption text-muted-foreground">
            El correo no se puede cambiar desde aquí.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pd-phone">Teléfono</Label>
          <Input id="pd-phone" value={profile.phone} disabled readOnly />
          <p className="text-caption text-muted-foreground">
            El teléfono no se puede cambiar desde aquí.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pd-birthDate">Fecha de nacimiento</Label>
          <Input
            id="pd-birthDate"
            type="date"
            value={values.birthDate ?? ""}
            disabled={update.isPending}
            onChange={(event) => patch({ birthDate: event.target.value || null })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pd-country">País</Label>
          <Input
            id="pd-country"
            value={values.country}
            disabled={update.isPending}
            placeholder="España"
            onChange={(event) => patch({ country: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Género</Label>
        <OptionGroup
          name="pd-gender"
          label="Género"
          options={GENDER_OPTIONS}
          value={values.gender || null}
          disabled={update.isPending}
          onChange={(gender) => patch({ gender })}
        />
      </div>

      <ImageUrlField
        id="pd-avatar"
        label="Foto de perfil"
        value={values.avatarPath}
        disabled={update.isPending}
        onChange={(avatarPath) => patch({ avatarPath })}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar datos
        </Button>
      </div>
    </form>
  )
}

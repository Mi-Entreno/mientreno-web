"use client"

import { Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"

import { ImageUrlField } from "@/components/shared/image-url-field"
import { GENDER_OPTIONS, OptionGroup } from "@/components/shared/option-group"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/core/http/errors"
import { SpecialtyMultiSelect } from "@/features/specialties/components/specialty-multi-select"
import type {
  CompleteProfileIdentityValues,
  TrainerProfileFormValues,
} from "../model/trainer-profile.model"
import { CertificationListEditor } from "./certification-list-editor"

type Errors = Partial<Record<string, string>>

interface TrainerProfileFormProps {
  /**
   * `complete` targets `POST /api/trainer/profile/complete`, which additionally
   * requires firstName and lastName and can only run once (409 afterwards).
   * `edit` targets `PUT /api/trainer/profile`.
   */
  mode: "complete" | "edit"
  initialValues: TrainerProfileFormValues
  initialIdentity?: CompleteProfileIdentityValues
  isPending: boolean
  error?: unknown
  onSubmit: (values: TrainerProfileFormValues, identity: CompleteProfileIdentityValues) => void
}

const EMPTY_IDENTITY: CompleteProfileIdentityValues = {
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "",
  country: "",
}

export function TrainerProfileForm({
  mode,
  initialValues,
  initialIdentity,
  isPending,
  error,
  onSubmit,
}: TrainerProfileFormProps) {
  const [values, setValues] = useState<TrainerProfileFormValues>(initialValues)
  const [identity, setIdentity] = useState<CompleteProfileIdentityValues>(
    initialIdentity ?? EMPTY_IDENTITY,
  )
  const [errors, setErrors] = useState<Errors>({})

  // Bean-validation 400s come back as a field -> message map. Showing them
  // inline beats a toast, since they are per-field by construction.
  const serverErrors: Errors = error instanceof ApiError ? error.fieldErrors : {}
  const allErrors = { ...serverErrors, ...errors }

  function patch(next: Partial<TrainerProfileFormValues>) {
    setValues((current) => ({ ...current, ...next }))
  }

  function validate(): boolean {
    const found: Errors = {}

    if (mode === "complete") {
      if (!identity.firstName.trim()) found.firstName = "El nombre es obligatorio"
      if (!identity.lastName.trim()) found.lastName = "Los apellidos son obligatorios"
    }

    if (values.basePrice.trim()) {
      const price = Number(values.basePrice.replace(",", "."))
      if (!Number.isFinite(price)) found.basePrice = "Introduce un número válido"
      else if (price < 0) found.basePrice = "La tarifa no puede ser negativa"
    }

    if (values.experienceYears.trim()) {
      const years = Number(values.experienceYears)
      if (!Number.isInteger(years)) found.experienceYears = "Introduce un número entero de años"
      else if (years < 0) found.experienceYears = "Los años no pueden ser negativos"
      else if (years > 80) found.experienceYears = "Introduce un valor realista"
    }

    // `name` is the only @NotBlank field on CertificationRequestDTO. A row with
    // data but no name would be silently dropped by the mapper, so flag it.
    const namelessWithData = values.certifications.some(
      (item) =>
        !item.name.trim() &&
        (item.issuedBy.trim() || item.issuedAt || item.expiresAt || item.certificateUrl),
    )
    if (namelessWithData) {
      found.certifications = "Cada certificación necesita un nombre"
    }

    setErrors(found)
    return Object.keys(found).length === 0
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return
    onSubmit(values, identity)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      {mode === "complete" && (
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-subtitle font-semibold tracking-tight">Tus datos</h2>
            <p className="mt-1 text-body text-muted-foreground">
              Solo se piden una vez, al crear tu perfil profesional.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">
                Nombre <span className="text-error-text">*</span>
              </Label>
              <Input
                id="firstName"
                value={identity.firstName}
                disabled={isPending}
                onChange={(event) =>
                  setIdentity((current) => ({ ...current, firstName: event.target.value }))
                }
              />
              {allErrors.firstName && (
                <p className="text-body text-error-text">{allErrors.firstName}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">
                Apellidos <span className="text-error-text">*</span>
              </Label>
              <Input
                id="lastName"
                value={identity.lastName}
                disabled={isPending}
                onChange={(event) =>
                  setIdentity((current) => ({ ...current, lastName: event.target.value }))
                }
              />
              {allErrors.lastName && (
                <p className="text-body text-error-text">{allErrors.lastName}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="birthDate">Fecha de nacimiento</Label>
              <Input
                id="birthDate"
                type="date"
                value={identity.birthDate}
                disabled={isPending}
                onChange={(event) =>
                  setIdentity((current) => ({ ...current, birthDate: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={identity.country}
                disabled={isPending}
                placeholder="España"
                onChange={(event) =>
                  setIdentity((current) => ({ ...current, country: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Género</Label>
              <OptionGroup
                name="gender"
                label="Género"
                options={GENDER_OPTIONS}
                value={identity.gender || null}
                disabled={isPending}
                onChange={(value) => setIdentity((current) => ({ ...current, gender: value }))}
              />
            </div>
          </div>

          <Separator />
        </section>
      )}

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">
            Perfil profesional
          </h2>
          <p className="mt-1 text-body text-muted-foreground">
            Esto es lo que ven los alumnos cuando te buscan.
          </p>
        </div>

        <ImageUrlField
          id="avatar"
          label="Foto de perfil"
          value={values.avatarPath}
          disabled={isPending}
          onChange={(value) => patch({ avatarPath: value })}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="bio">Sobre ti</Label>
          <Textarea
            id="bio"
            rows={5}
            value={values.bio}
            disabled={isPending}
            placeholder="Cuenta tu experiencia, tu metodología y con qué tipo de alumnos trabajas."
            onChange={(event) => patch({ bio: event.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="basePrice">Tarifa base (€)</Label>
            <Input
              id="basePrice"
              inputMode="decimal"
              value={values.basePrice}
              disabled={isPending}
              placeholder="45"
              onChange={(event) => patch({ basePrice: event.target.value })}
            />
            {allErrors.basePrice && (
              <p className="text-body text-error-text">{allErrors.basePrice}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="experienceYears">Años de experiencia</Label>
            <Input
              id="experienceYears"
              inputMode="numeric"
              value={values.experienceYears}
              disabled={isPending}
              placeholder="6"
              onChange={(event) => patch({ experienceYears: event.target.value })}
            />
            {allErrors.experienceYears && (
              <p className="text-body text-error-text">{allErrors.experienceYears}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={values.location}
              disabled={isPending}
              placeholder="Madrid"
              onChange={(event) => patch({ location: event.target.value })}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">Especialidades</h2>
          <p className="mt-1 text-body text-muted-foreground">
            Los alumnos filtran por estas etiquetas al buscar entrenador.
          </p>
        </div>
        <SpecialtyMultiSelect
          value={values.specialtyIds}
          disabled={isPending}
          onChange={(specialtyIds) => patch({ specialtyIds })}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">
            Certificaciones
          </h2>
          <p className="mt-1 text-body text-muted-foreground">
            Añade titulaciones que respalden tu experiencia.
          </p>
        </div>
        <CertificationListEditor
          value={values.certifications}
          disabled={isPending}
          onChange={(certifications) => patch({ certifications })}
        />
        {allErrors.certifications && (
          <p className="text-body text-error-text">{allErrors.certifications}</p>
        )}
      </section>

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {mode === "complete" ? "Crear perfil" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}

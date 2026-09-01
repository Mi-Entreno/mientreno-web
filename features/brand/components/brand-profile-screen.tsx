"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Store } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/core/http/errors"

import { brandRepository } from "../api/brand.repository"
import { useBrandProfile, useUpdateBrandProfile } from "../hooks/use-brand"

const schema = z.object({
  firstName: z.string().trim().min(1, "Tu nombre es obligatorio").max(100),
  lastName: z.string().trim().min(1, "Tu apellido es obligatorio").max(100),
  displayName: z.string().trim().min(1, "El nombre del comercio es obligatorio").max(150),
  legalName: z.string().trim().max(200).optional(),
  taxId: z.string().trim().max(20).optional(),
  description: z.string().trim().max(2000).optional(),
  contactEmail: z.union([z.literal(""), z.string().email("Correo inválido")]).optional(),
  contactPhone: z.string().trim().max(20).optional(),
  pickupAddress: z
    .string()
    .trim()
    .min(1, "Sin dirección de retiro el alumno no sabe dónde buscar su premio")
    .max(250),
  pickupNotes: z.string().trim().max(2000).optional(),
})

type FormValues = z.infer<typeof schema>

/**
 * Perfil del comercio, y también su onboarding.
 *
 * Cuando el perfil todavía no existe, el guard manda acá con `?complete=1` y la
 * pantalla se convierte en el alta. Es una sola pantalla y no dos porque los
 * campos son los mismos; lo único que cambia es que el alta pide además el
 * nombre de la persona (va a `UserDetailDb`, común a los tres perfiles) y que
 * al terminar reemite los tokens.
 */
export function BrandProfileScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const query = useBrandProfile()
  const update = useUpdateBrandProfile()
  const [completing, setCompleting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // 404 acá no es un error: es el comercio que verificó su email y todavía no
  // cargó sus datos. El guard ya lo mandó a esta pantalla con `?complete=1`.
  const missingProfile =
    query.isError && query.error instanceof ApiError && query.error.status === 404
  const isOnboarding = missingProfile || params.get("complete") === "1"

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      displayName: "",
      legalName: "",
      taxId: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      pickupAddress: "",
      pickupNotes: "",
    },
  })

  useEffect(() => {
    if (!query.data) return
    reset({
      firstName: "",
      lastName: "",
      displayName: query.data.displayName,
      legalName: query.data.legalName ?? "",
      taxId: query.data.taxId ?? "",
      description: query.data.description ?? "",
      contactEmail: query.data.contactEmail ?? "",
      contactPhone: query.data.contactPhone ?? "",
      pickupAddress: query.data.pickupAddress ?? "",
      pickupNotes: query.data.pickupNotes ?? "",
    })
  }, [query.data, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      displayName: values.displayName,
      legalName: values.legalName || undefined,
      taxId: values.taxId || undefined,
      description: values.description || undefined,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
      pickupAddress: values.pickupAddress,
      pickupNotes: values.pickupNotes || undefined,
    }

    if (!isOnboarding && query.data) {
      update.mutate(payload)
      return
    }

    setCompleting(true)
    try {
      // Va por su propia ruta del BFF y no por el proxy genérico porque la
      // respuesta trae tokens nuevos con `profileCompleted: true` y hay que
      // escribirlos en la cookie. Proxearla dejaría al comercio dando vueltas
      // en el onboarding — el mismo motivo por el que existe
      // `app/auth/complete-profile` para el entrenador.
      const response = await fetch("/auth/brand/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          ...payload,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        toast.error(body?.message ?? "No pudimos guardar tu comercio. Volvé a intentarlo.")
        return
      }

      toast.success("¡Listo! Ya podés cargar tus productos.")
      router.replace("/comercio")
      router.refresh()
    } catch {
      toast.error("Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos.")
    } finally {
      setCompleting(false)
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (query.isError && !missingProfile) {
    return <ErrorState error={query.error} context="load" onRetry={() => query.refetch()} />
  }

  const pending = update.isPending || completing

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {isOnboarding && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-body-lg">Completá los datos de tu comercio</CardTitle>
          </CardHeader>
          <CardContent className="text-body text-muted-foreground text-pretty">
            Con esto ya podés empezar a cargar productos. La dirección de retiro es la que van a ver
            los alumnos al canjear.
          </CardContent>
        </Card>
      )}

      {!isOnboarding && query.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-body-lg">Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <span className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
              {query.data.logoUrl ? (
                <Image
                  src={query.data.logoUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="size-full object-cover"
                  unoptimized
                />
              ) : (
                <Store className="size-7 text-muted-foreground" />
              )}
            </span>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (!file) return
                setUploading(true)
                try {
                  await brandRepository.uploadLogo(file)
                  await query.refetch()
                  toast.success("Logo actualizado.")
                } catch {
                  toast.error("No pudimos subir el archivo. Volvé a intentarlo.")
                } finally {
                  setUploading(false)
                }
              }}
            />
            <Button variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}>
              <ImagePlus className="size-4" />
              Cambiar logo
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {isOnboarding && (
          <Card>
            <CardHeader>
              <CardTitle className="text-body-lg">Quién administra la cuenta</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field id="firstName" label="Nombre" error={errors.firstName?.message}>
                <Input id="firstName" disabled={pending} {...register("firstName")} />
              </Field>
              <Field id="lastName" label="Apellido" error={errors.lastName?.message}>
                <Input id="lastName" disabled={pending} {...register("lastName")} />
              </Field>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-body-lg">El comercio</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field
              id="displayName"
              label="Nombre comercial"
              hint="Es el que ven los alumnos en la tarjeta del producto."
              error={errors.displayName?.message}
            >
              <Input id="displayName" disabled={pending} {...register("displayName")} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="legalName" label="Razón social (opcional)" error={errors.legalName?.message}>
                <Input id="legalName" disabled={pending} {...register("legalName")} />
              </Field>
              <Field id="taxId" label="CUIT (opcional)" error={errors.taxId?.message}>
                <Input id="taxId" disabled={pending} {...register("taxId")} />
              </Field>
            </div>

            <Field id="description" label="Descripción (opcional)" error={errors.description?.message}>
              <Textarea id="description" rows={3} disabled={pending} {...register("description")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-body-lg">Retiro y contacto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field
              id="pickupAddress"
              label="Dirección de retiro"
              hint="Los alumnos la ven antes de canjear y en el detalle de su canje."
              error={errors.pickupAddress?.message}
            >
              <Input id="pickupAddress" disabled={pending} {...register("pickupAddress")} />
            </Field>

            <Field
              id="pickupNotes"
              label="Aclaraciones (opcional)"
              hint="Horarios, por quién preguntar, cualquier cosa que ayude a retirar."
              error={errors.pickupNotes?.message}
            >
              <Textarea id="pickupNotes" rows={2} disabled={pending} {...register("pickupNotes")} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="contactEmail"
                label="Email de contacto (opcional)"
                error={errors.contactEmail?.message}
              >
                <Input id="contactEmail" type="email" disabled={pending} {...register("contactEmail")} />
              </Field>
              <Field
                id="contactPhone"
                label="Teléfono (opcional)"
                error={errors.contactPhone?.message}
              >
                <Input id="contactPhone" type="tel" disabled={pending} {...register("contactPhone")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {isOnboarding ? "Crear mi comercio" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-caption text-muted-foreground text-pretty">{hint}</p>}
      {error && <p className="text-caption text-error-text">{error}</p>}
    </div>
  )
}

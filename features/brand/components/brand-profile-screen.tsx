"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Loader2, Store } from "lucide-react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
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
import {
  INSTAGRAM_HANDLE,
  WEBSITE_URL,
  normalizeInstagram,
  normalizeWebsite,
} from "../model/brand.model"

/**
 * Los campos del comercio, que son los mismos en el alta y en la edición.
 *
 * Las redes se validan sobre su forma **normalizada**, no sobre lo que se
 * escribió: el comercio pega el enlace que copió de Instagram y eso es válido
 * aunque no se parezca a un usuario. Lo que viaja al backend sale del mismo
 * normalizador, así que lo que acá pasa, allá pasa.
 */
const profileFields = {
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
  instagram: z
    .string()
    .trim()
    .max(120)
    .refine(
      (value) => value === "" || INSTAGRAM_HANDLE.test(normalizeInstagram(value)),
      "Poné tu usuario o el enlace a tu perfil",
    )
    .optional(),
  // 190 y no 200: el normalizador puede agregarle "https://" y la columna del
  // backend corta en 200.
  websiteUrl: z
    .string()
    .trim()
    .max(190)
    .refine(
      (value) => value === "" || WEBSITE_URL.test(normalizeWebsite(value)),
      "Poné la dirección completa, por ejemplo micomercio.com",
    )
    .optional(),
}

const identityFields = {
  firstName: z.string().trim().min(1, "Tu nombre es obligatorio").max(100),
  lastName: z.string().trim().min(1, "Tu apellido es obligatorio").max(100),
}

const onboardingSchema = z.object({ ...profileFields, ...identityFields })

/**
 * En edición el nombre de la persona no se pide ni se muestra: vive en
 * `UserDetailDb` y sólo lo escribe el alta.
 *
 * Tener un único esquema con los dos campos obligatorios era el motivo por el
 * que "Guardar cambios" no hacía nada: los inputs no se renderizan fuera del
 * onboarding, así que llegaban vacíos, `handleSubmit` abortaba y el error
 * quedaba colgado de un campo invisible. Sin reacción en pantalla y sin
 * petición.
 */
const editSchema = z.object({
  ...profileFields,
  // Presentes y sin exigencias, no ausentes: así los dos esquemas infieren el
  // mismo tipo y `useForm` puede cambiar de resolver sin cambiar de forma.
  firstName: z.string(),
  lastName: z.string(),
})

type FormValues = z.infer<typeof onboardingSchema>

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

  // La ausencia del perfil manda sobre el parámetro, no al revés: el claim del
  // JWT puede ir atrasado y dejar `?complete=1` pegado en la URL de alguien que
  // ya tiene comercio. Con el parámetro como autoridad, ese comercio editaba su
  // perfil contra el endpoint de alta y se comía un 409.
  const isOnboarding = missingProfile || (!query.data && params.get("complete") === "1")

  const resolver = useMemo(
    () => zodResolver(isOnboarding ? onboardingSchema : editSchema),
    [isOnboarding],
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
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
      instagram: "",
      websiteUrl: "",
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
      instagram: query.data.instagram ?? "",
      websiteUrl: query.data.websiteUrl ?? "",
    })
  }, [query.data, reset])

  /**
   * Deja en el campo exactamente lo que se va a guardar.
   *
   * Normalizar en silencio al enviar dejaría al comercio mirando el enlace
   * largo que pegó y creyendo que eso es lo que quedó guardado. Va como opción
   * de `register` y no como un `onBlur` propio: reemplazar el del registro le
   * saca a react-hook-form el evento con el que marca el campo como tocado.
   */
  function normalizing(field: "instagram" | "websiteUrl", normalize: (value: string) => string) {
    return {
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        setValue(field, normalize(event.target.value), { shouldValidate: true })
      },
    }
  }

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
      instagram: normalizeInstagram(values.instagram ?? "") || undefined,
      websiteUrl: normalizeWebsite(values.websiteUrl ?? "") || undefined,
    }

    if (!isOnboarding) {
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
        setCompleting(false)
        return
      }

      toast.success("¡Listo! Ya podés cargar tus recompensas.")

      // Navegación dura, y no `router.replace("/comercio")`.
      //
      // El botón parecía no hacer nada: la barra lateral prefetchea `/comercio`
      // apenas se pinta, o sea mientras el perfil todavía estaba incompleto, y
      // lo que el router cachea de ese prefetch es el redirect del guard hacia
      // `/comercio/perfil?complete=1`. Una navegación blanda reusa esa entrada
      // y devuelve al comercio a esta misma pantalla, con la cookie nueva y
      // todo. Un pedido de documento nuevo tira el caché del router entero y
      // reevalúa el guard contra la cookie recién escrita.
      //
      // No se apaga `completing`: la página se está yendo y reactivar el botón
      // sólo invita a un segundo alta que responde 409.
      window.location.assign("/comercio")
    } catch {
      toast.error("Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos.")
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
            Con esto ya podés empezar a cargar recompensas. La dirección de retiro es la que van a ver
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
              hint="Es el que ven los alumnos en la tarjeta de la recompensa."
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

        {/*
          Redes: las dos opcionales y las dos públicas, a diferencia del email y
          el teléfono de abajo, que son operativos. El comercio puede pegar el
          enlace entero y el campo se normaliza al salir, así que lo que ve es
          lo que se guarda.
        */}
        <Card>
          <CardHeader>
            <CardTitle className="text-body-lg">Redes (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              id="instagram"
              label="Instagram"
              hint="Tu usuario o el enlace a tu perfil."
              error={errors.instagram?.message}
            >
              <Input
                id="instagram"
                inputMode="url"
                placeholder="micomercio"
                disabled={pending}
                {...register("instagram", normalizing("instagram", normalizeInstagram))}
              />
            </Field>
            <Field
              id="websiteUrl"
              label="Sitio web"
              hint="Si no ponés http://, lo completamos por vos."
              error={errors.websiteUrl?.message}
            >
              <Input
                id="websiteUrl"
                type="url"
                inputMode="url"
                placeholder="micomercio.com"
                disabled={pending}
                {...register("websiteUrl", normalizing("websiteUrl", normalizeWebsite))}
              />
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
            {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {submitLabel(isOnboarding, pending)}
          </Button>
        </div>
      </form>
    </div>
  )
}

/** El botón dice en qué estado está: sin esto, guardar no se distingue de no hacer nada. */
function submitLabel(isOnboarding: boolean, pending: boolean): string {
  if (isOnboarding) return pending ? "Creando tu comercio…" : "Crear mi comercio"
  return pending ? "Guardando…" : "Guardar cambios"
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

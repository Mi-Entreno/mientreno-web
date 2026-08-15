"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Mail } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { emailSchema } from "../model/password"
import { AuthField } from "./auth-field"
import { AuthShell } from "./auth-shell"
import { AuthSubmitButton } from "./auth-submit-button"
import { PasswordField } from "./password-field"

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
})

type FormValues = z.infer<typeof schema>

/** Shape returned by `app/api/auth/login/route.ts` — never includes tokens. */
interface LoginResult {
  email: string
  firstName: string | null
  profileCompleted: boolean
  accountVerified: boolean
  message?: string
}

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [submitting, setSubmitting] = useState(false)

  const guardError = params.get("error")
  const justVerified = params.get("verified") === "1"

  useEffect(() => {
    // The route guard redirects here with `?error=role` for a non-trainer.
    if (guardError === "role") {
      toast.error("Esta cuenta no es de entrenador. Usa la aplicación para alumnos.")
    }
    if (justVerified) {
      toast.success("Cuenta verificada. Ya puedes iniciar sesión.")
    }
  }, [guardError, justVerified])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get("email") ?? "", password: "" },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      // Must go through the BFF, not straight at the backend: only the route
      // handler can set the httpOnly session cookie, and `profileCompleted`
      // is a JWT claim that `AuthResponseDTO` does not expose at top level.
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = (await res.json()) as LoginResult

      if (!res.ok) {
        toast.error(data.message ?? "No se pudo iniciar sesión")
        return
      }

      // `loginUser` issues tokens regardless of verification, so an unverified
      // trainer gets a valid session — but most flows expect a verified
      // account, so finish that first.
      if (!data.accountVerified) {
        toast.warning("Tu cuenta aún no está verificada")
        router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`)
        return
      }

      // Most of the API is unusable until the professional profile exists, and
      // the route guard enforces the same rule server-side.
      if (!data.profileCompleted) {
        router.push("/dashboard/profile?complete=1")
        router.refresh()
        return
      }

      toast.success(
        data.firstName ? `Bienvenido de nuevo, ${data.firstName}` : "Bienvenido de nuevo",
      )
      const from = params.get("from")
      router.push(from && from.startsWith("/dashboard") ? from : "/dashboard")
      router.refresh()
    } catch {
      toast.error("No se pudo conectar con el servidor")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Inicia sesión en tu panel"
      description="Gestiona tus alumnos, planes y programas en un solo lugar."
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary-text underline underline-offset-4 hover:text-foreground"
          >
            Crea una
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5" noValidate>
        <AuthField
          id="email"
          label="Correo electrónico"
          icon={Mail}
          type="email"
          placeholder="tu@gimnasio.com"
          autoComplete="email"
          disabled={submitting}
          error={errors.email?.message}
          {...register("email")}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange } }) => (
            <PasswordField
              id="password"
              label="Contraseña"
              value={value}
              onChange={onChange}
              error={errors.password?.message}
              disabled={submitting}
              autoComplete="current-password"
              action={
                <Link
                  href="/forgot-password"
                  className="text-caption font-medium text-muted-foreground underline underline-offset-4 hover:text-primary-text"
                >
                  ¿Has olvidado tu contraseña?
                </Link>
              }
            />
          )}
        />

        <AuthSubmitButton pending={submitting} pendingLabel="Iniciando sesión…">
          Iniciar sesión
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}

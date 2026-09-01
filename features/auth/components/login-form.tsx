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
import {
  AUDIENCES,
  BRAND_AUDIENCE,
  TRAINER_AUDIENCE,
  type AudienceCopy,
  type AudienceId,
} from "../model/audience"
import { AuthShell } from "./auth-shell"
import { AuthSubmitButton } from "./auth-submit-button"
import { PasswordField } from "./password-field"

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
})

type FormValues = z.infer<typeof schema>

/** Shape returned by `app/auth/login/route.ts` — never includes tokens. */
interface LoginResult {
  email: string
  firstName: string | null
  profileCompleted: boolean
  accountVerified: boolean
  /** Panel this session belongs to, decided upstream by `homeFor`. */
  home?: string | null
  message?: string
}

/**
 * Both audiences use this form; only the pitch and the links change.
 *
 * Takes the audience **id** and not the copy object. The pages that render this
 * are server components and `AudienceCopy` carries Lucide icons, which are
 * functions: handing one across the server/client boundary fails the build with
 * "Functions cannot be passed directly to Client Components". A string crosses
 * fine and the lookup happens here, on the client, where the icons already live.
 *
 * Where the user ends up is **not** decided here — it comes back in `home`,
 * derived from the JWT by the route handler. Deciding it client-side would put
 * a second opinion next to the guard's, and two opinions about "which panel is
 * yours" is how you get a redirect loop.
 */
export function LoginForm({ audience: audienceId = "trainer" }: { audience?: AudienceId }) {
  const audience = AUDIENCES[audienceId] ?? TRAINER_AUDIENCE
  const router = useRouter()
  const params = useSearchParams()
  const [submitting, setSubmitting] = useState(false)

  const guardError = params.get("error")
  const justVerified = params.get("verified") === "1"

  useEffect(() => {
    // The guard redirects here with `?error=role` for an account that belongs
    // to neither panel — in practice, a student's.
    if (guardError === "role") {
      toast.error("Esta cuenta es de alumno. Usá la aplicación móvil para entrenar.")
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

      // An unverified account comes back without tokens, so there is no session
      // to use yet: finish verification first.
      if (!data.accountVerified) {
        toast.warning("Tu cuenta aún no está verificada")
        router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`)
        return
      }

      // The panel that owns this session, decided upstream. Falls back to the
      // audience's own home only if the field is missing, which would mean an
      // older BFF build.
      const home = data.home ?? audience.homePrefix

      // Most of the API is unusable until the profile exists, and the route
      // guard enforces the same rule server-side.
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
    } catch {
      toast.error("Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      brand={audience.brand}
      title={audience.loginTitle}
      description={audience.loginDescription}
      footer={
        <>
          ¿Aún no tenés cuenta?{" "}
          <Link
            href={audience.registerHref}
            className="font-semibold text-primary-text underline underline-offset-4 hover:text-foreground"
          >
            Creá una
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

/**
 * Onboarding path for the panel the session actually belongs to.
 *
 * Uses `home` and not the audience of the page: someone can sign in through the
 * trainer door with a merchant account, and sending them to the trainer's
 * profile form would strand them in a loop.
 */
function profilePathFor(home: string, audience: AudienceCopy): string {
  if (home.startsWith(BRAND_AUDIENCE.homePrefix)) return BRAND_AUDIENCE.profilePath
  if (home.startsWith(TRAINER_AUDIENCE.homePrefix)) return TRAINER_AUDIENCE.profilePath
  return audience.profilePath
}

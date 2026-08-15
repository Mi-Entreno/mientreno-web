"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Phone } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { ApiError } from "@/core/http/errors"
import { useRegister } from "../hooks/use-auth-actions"
import { registerSchema, type RegisterFormValues } from "../model/password"
import { AuthField } from "./auth-field"
import { AuthShell } from "./auth-shell"
import { AuthSubmitButton } from "./auth-submit-button"
import { PasswordField } from "./password-field"

/**
 * Trainer registration — `POST /auth/trainer/register`.
 *
 * The endpoint answers `AuthResponseDTO.noToken(...)`: no JWT, no refresh
 * token, and the message "Por favor iniciá sesión". So this never logs the user
 * in; it hands off to email verification and then to the login screen.
 */
export function RegisterForm() {
  const router = useRouter()
  const register = useRegister()

  const {
    register: field,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", phone: "" },
  })

  function onSubmit(values: RegisterFormValues) {
    register.mutate(
      { email: values.email, password: values.password, phone: values.phone },
      {
        onSuccess: (result) => {
          if (result.verificationCodeSent) {
            toast.success("Cuenta creada. Te hemos enviado un código de verificación.")
          } else {
            // Registration succeeded but the code did not go out; the OTP screen
            // exposes a resend button for exactly this.
            toast.warning("Cuenta creada, pero no hemos podido enviar el código. Pídelo de nuevo.")
          }
          router.push(`/verify-otp?email=${encodeURIComponent(result.email)}`)
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            toast.error("No se ha podido conectar con el servidor")
            return
          }

          // Bean-validation 400s map straight onto the fields.
          const fields = error.fieldErrors
          let matched = false
          for (const [name, message] of Object.entries(fields)) {
            if (name === "email" || name === "password" || name === "phone") {
              setError(name, { message })
              matched = true
            }
          }
          if (matched) return

          // "El email ya se encuentra registrado" arrives as a 400 business error.
          if (/email/i.test(error.message)) {
            setError("email", { message: error.message })
            return
          }

          toast.error(error.message)
        },
      },
    )
  }

  return (
    <AuthShell
      title="Crea tu cuenta de entrenador"
      description="Empieza a gestionar tus alumnos, planes y programas."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary-text underline underline-offset-4 hover:text-foreground"
          >
            Inicia sesión
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
          autoComplete="email"
          placeholder="tu@gimnasio.com"
          disabled={register.isPending}
          error={errors.email?.message}
          {...field("email")}
        />

        <AuthField
          id="phone"
          label="Teléfono (opcional)"
          icon={Phone}
          type="tel"
          autoComplete="tel"
          placeholder="+34600111222"
          disabled={register.isPending}
          error={errors.phone?.message}
          {...field("phone")}
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
              disabled={register.isPending}
              showRules
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { value, onChange } }) => (
            <PasswordField
              id="confirmPassword"
              label="Repite la contraseña"
              value={value}
              onChange={onChange}
              error={errors.confirmPassword?.message}
              disabled={register.isPending}
            />
          )}
        />

        <AuthSubmitButton pending={register.isPending} pendingLabel="Creando cuenta…">
          Crear cuenta
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}

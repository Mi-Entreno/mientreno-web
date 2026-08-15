"use client"

import { ArrowLeft, Check, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ApiError } from "@/core/http/errors"
import { OTP_LENGTH } from "../dto/auth.dto"
import {
  useConfirmPasswordReset,
  useRequestPasswordReset,
  useVerifyResetCode,
} from "../hooks/use-auth-actions"
import { passwordSchema } from "../model/password"
import { AuthField, AuthFieldFrame } from "./auth-field"
import { AuthShell } from "./auth-shell"
import { AuthSubmitButton } from "./auth-submit-button"
import { OtpInput } from "./otp-input"
import { PasswordField } from "./password-field"

type Step = "request" | "verify" | "confirm"

const STEPS: { id: Step; label: string }[] = [
  { id: "request", label: "Correo" },
  { id: "verify", label: "Código" },
  { id: "confirm", label: "Contraseña" },
]

/**
 * Password recovery, as the three upstream calls it actually takes:
 * `/password-reset/request` -> `/verify` -> `/confirm`.
 *
 * `verify` is deliberately a separate step rather than folded into `confirm`:
 * `PasswordRecoveryService.verifyResetCode` does not consume the token
 * (`resetPassword` re-validates it), so checking it early tells the user their
 * code is wrong before they bother choosing a new password.
 */
export function ForgotPasswordForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const request = useRequestPasswordReset()
  const verify = useVerifyResetCode()
  const confirm = useConfirmPasswordReset()

  function fail(error: unknown, fallback: string) {
    toast.error(error instanceof ApiError ? error.message : fallback)
  }

  function submitRequest() {
    if (!email.trim()) {
      setErrors({ email: "El correo es obligatorio" })
      return
    }
    setErrors({})

    request.mutate(email, {
      onSuccess: () => {
        // The backend returns silently for unknown emails so the endpoint
        // cannot be used to enumerate accounts. The wording has to match.
        toast.success("Si la cuenta existe, recibirás un código en tu correo")
        setStep("verify")
      },
      onError: (error) => fail(error, "No se ha podido solicitar el código"),
    })
  }

  function submitVerify(value: string = code) {
    if (value.length !== OTP_LENGTH) return

    verify.mutate(
      { email, code: value },
      {
        onSuccess: () => setStep("confirm"),
        onError: (error) => {
          setCode("")
          fail(error, "El código no es válido")
        },
      },
    )
  }

  function submitConfirm() {
    const parsed = passwordSchema.safeParse(password)
    const found: Record<string, string> = {}

    if (!parsed.success) found.password = parsed.error.issues[0].message
    if (password !== confirmPassword) found.confirmPassword = "Las contraseñas no coinciden"

    setErrors(found)
    if (Object.keys(found).length > 0) return

    confirm.mutate(
      { email, code, newPassword: password },
      {
        onSuccess: () => {
          toast.success("Contraseña actualizada. Ya puedes iniciar sesión.")
          router.push(`/login?email=${encodeURIComponent(email.trim())}`)
        },
        onError: (error) => {
          // An expired code lands here; send the user back a step.
          if (error instanceof ApiError && error.status === 400) {
            setStep("verify")
            setCode("")
          }
          fail(error, "No se ha podido actualizar la contraseña")
        },
      },
    )
  }

  const currentIndex = STEPS.findIndex((item) => item.id === step)
  const isPending = request.isPending || verify.isPending || confirm.isPending

  return (
    <AuthShell
      title="Recupera tu contraseña"
      description="Te enviaremos un código para que puedas elegir una nueva."
      footer={
        <Link
          href="/login"
          className="font-semibold text-primary-text underline underline-offset-4 hover:text-foreground"
        >
          Volver a iniciar sesión
        </Link>
      }
    >
      <ol className="mt-8 flex items-start gap-2" aria-label="Progreso">
        {STEPS.map((item, index) => {
          const done = index < currentIndex
          const reached = index <= currentIndex
          return (
            <li key={item.id} className="flex flex-1 flex-col gap-2">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  reached ? "bg-primary" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "flex items-center gap-1.5 text-caption",
                  reached ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border text-caption leading-none font-semibold transition-colors",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : index === currentIndex
                        ? "border-primary text-primary-text"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3" /> : index + 1}
                </span>
                {item.label}
              </span>
            </li>
          )
        })}
      </ol>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (step === "request") submitRequest()
          else if (step === "verify") submitVerify()
          else submitConfirm()
        }}
        className="mt-7 flex flex-col gap-5"
        noValidate
      >
        {step === "request" && (
          <AuthField
            id="fp-email"
            label="Correo electrónico"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="tu@gimnasio.com"
            value={email}
            disabled={isPending}
            error={errors.email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}

        {step === "verify" && (
          <AuthFieldFrame
            id="fp-code"
            label="Código recibido"
            hint={`Lo hemos enviado a ${email}.`}
          >
            <OtpInput
              id="fp-code"
              value={code}
              onChange={setCode}
              onComplete={submitVerify}
              disabled={isPending}
              invalid={verify.isError}
              autoFocus
            />
          </AuthFieldFrame>
        )}

        {step === "confirm" && (
          <>
            <PasswordField
              id="fp-password"
              label="Nueva contraseña"
              value={password}
              onChange={setPassword}
              error={errors.password}
              disabled={isPending}
              showRules
            />
            <PasswordField
              id="fp-confirm"
              label="Repite la contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
              disabled={isPending}
            />
          </>
        )}

        <AuthSubmitButton
          pending={isPending}
          disabled={step === "verify" && code.length !== OTP_LENGTH}
        >
          {step === "request" && "Enviar código"}
          {step === "verify" && "Comprobar código"}
          {step === "confirm" && "Guardar contraseña"}
        </AuthSubmitButton>

        {step !== "request" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setErrors({})
              setStep(step === "confirm" ? "verify" : "request")
            }}
            className="self-start text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Atrás
          </Button>
        )}
      </form>
    </AuthShell>
  )
}

"use client"

import { Loader2, Mail, MailCheck } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ApiError } from "@/core/http/errors"
import { specificMessage } from "@/core/http/user-message"
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from "../dto/auth.dto"
import { useResendOtp, useVerifyOtp } from "../hooks/use-auth-actions"
import { useResendCooldown } from "../hooks/use-resend-cooldown"
import { AuthField, AuthFieldFrame } from "./auth-field"
import { AuthShell } from "./auth-shell"
import { AuthSubmitButton } from "./auth-submit-button"
import { OtpInput } from "./otp-input"

/**
 * Email verification — `POST /auth/register/verify-otp` and
 * `/auth/register/resend-otp`.
 *
 * Reachable directly (not only after registering), because an unverified user
 * can log in and be sent here later: `loginUser` does not block on
 * `accountVerified`.
 */
export function VerifyOtpForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [email, setEmail] = useState(params.get("email") ?? "")

  // Which login screen to return to. The registration form carries it in
  // `?next` so a merchant does not land on the trainer door after verifying.
  // Allowlisted rather than trusted: `next` comes from the URL bar, and a bare
  // redirect to whatever it says is an open redirect.
  const nextLogin = LOGIN_PATHS.has(params.get("next") ?? "")
    ? (params.get("next") as string)
    : "/login"
  const [code, setCode] = useState("")

  const verify = useVerifyOtp()
  const resend = useResendOtp()
  const cooldown = useResendCooldown()

  const invalid = verify.isError

  function submit(value: string = code) {
    if (value.length !== OTP_LENGTH || !email.trim()) return

    verify.mutate(
      { email, code: value },
      {
        onSuccess: (result) => {
          toast.success(result?.message ?? "Cuenta verificada")
          router.push(`${nextLogin}?verified=1&email=${encodeURIComponent(email.trim())}`)
        },
        onError: (error) => {
          setCode("")
          toast.error(
            specificMessage(error) ?? "No pudimos verificar el código. Volvé a intentarlo.",
          )
        },
      },
    )
  }

  function handleResend() {
    if (!email.trim()) {
      toast.error("Introduce tu correo para reenviar el código")
      return
    }

    resend.mutate(email, {
      onSuccess: () => {
        cooldown.start()
        toast.success("Te hemos enviado un código nuevo")
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 429) {
          // The 429 body names the exact seconds remaining — use them so the
          // local timer agrees with the server.
          cooldown.startFromMessage(error.message)
          toast.error(error.message)
          return
        }
        if (error instanceof ApiError && error.status === 409) {
          // "La cuenta ya está verificada" — nothing left to do here.
          toast.info(error.message)
          router.push(nextLogin)
          return
        }
        toast.error(
          specificMessage(error) ?? "No pudimos reenviar el código. Volvé a intentarlo.",
        )
      },
    })
  }

  return (
    <AuthShell
      title="Verifica tu correo"
      description={`Introduce el código de ${OTP_LENGTH} dígitos que te hemos enviado. Caduca en ${OTP_EXPIRY_MINUTES} minutos.`}
      footer={
        <Link
          href="/login"
          className="font-semibold text-primary-text underline underline-offset-4 hover:text-foreground"
        >
          Volver a iniciar sesión
        </Link>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="mt-8 flex flex-col gap-5"
        noValidate
      >
        <AuthField
          id="otp-email"
          label="Correo electrónico"
          icon={Mail}
          type="email"
          autoComplete="email"
          value={email}
          disabled={verify.isPending}
          onChange={(event) => setEmail(event.target.value)}
        />

        <AuthFieldFrame id="otp-code" label="Código de verificación">
          <OtpInput
            id="otp-code"
            value={code}
            onChange={setCode}
            // Submitting on the last digit saves a click; the button stays for
            // keyboard and retry flows.
            onComplete={submit}
            disabled={verify.isPending}
            invalid={invalid}
            autoFocus={Boolean(params.get("email"))}
          />
        </AuthFieldFrame>

        <AuthSubmitButton
          pending={verify.isPending}
          pendingLabel="Verificando…"
          disabled={code.length !== OTP_LENGTH}
        >
          Verificar cuenta
        </AuthSubmitButton>

        <div className="mt-1 flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-4 text-center">
          <p className="flex items-center gap-2 text-body text-muted-foreground">
            <MailCheck className="size-4 text-primary-text" />
            ¿No te ha llegado?
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary-text hover:bg-success-surface"
            disabled={resend.isPending || cooldown.isCoolingDown}
            onClick={handleResend}
          >
            {resend.isPending && <Loader2 className="size-4 animate-spin" />}
            {cooldown.isCoolingDown ? `Reenviar en ${cooldown.secondsLeft}s` : "Reenviar código"}
          </Button>
        </div>
      </form>
    </AuthShell>
  )
}

/**
 * The only destinations `?next` may name.
 *
 * A closed set and not a "starts with /" check: the second lets anyone craft a
 * verification link that dumps the user anywhere in the app, and eventually
 * off it.
 */
const LOGIN_PATHS = new Set(["/login", "/comercio/login"])

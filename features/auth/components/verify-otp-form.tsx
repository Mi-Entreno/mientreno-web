"use client"

import { Loader2, MailCheck } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/core/http/errors"
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from "../dto/auth.dto"
import { useResendOtp, useVerifyOtp } from "../hooks/use-auth-actions"
import { useResendCooldown } from "../hooks/use-resend-cooldown"
import { AuthShell } from "./auth-shell"
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
          router.push(`/login?verified=1&email=${encodeURIComponent(email.trim())}`)
        },
        onError: (error) => {
          setCode("")
          toast.error(
            error instanceof ApiError ? error.message : "No se ha podido verificar el código",
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
          router.push("/login")
          return
        }
        toast.error(
          error instanceof ApiError ? error.message : "No se ha podido reenviar el código",
        )
      },
    })
  }

  return (
    <AuthShell
      title="Verifica tu correo"
      description={`Introduce el código de ${OTP_LENGTH} dígitos que te hemos enviado. Caduca en ${OTP_EXPIRY_MINUTES} minutos.`}
      footer={
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="mt-6 flex flex-col gap-5"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="otp-email">Correo electrónico</Label>
          <Input
            id="otp-email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={verify.isPending}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="otp-code">Código de verificación</Label>
          <OtpInput
            value={code}
            onChange={setCode}
            // Submitting on the last digit saves a click; the button stays for
            // keyboard and retry flows.
            onComplete={submit}
            disabled={verify.isPending}
            invalid={invalid}
            autoFocus={Boolean(params.get("email"))}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={verify.isPending || code.length !== OTP_LENGTH}
        >
          {verify.isPending && <Loader2 className="size-4 animate-spin" />}
          {verify.isPending ? "Verificando…" : "Verificar cuenta"}
        </Button>

        <div className="flex flex-col items-center gap-2 border-t border-border pt-5">
          <p className="flex items-center gap-2 text-body text-muted-foreground">
            <MailCheck className="size-4" />
            ¿No te ha llegado?
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={resend.isPending || cooldown.isCoolingDown}
            onClick={handleResend}
          >
            {resend.isPending && <Loader2 className="size-4 animate-spin" />}
            {cooldown.isCoolingDown
              ? `Reenviar en ${cooldown.secondsLeft}s`
              : "Reenviar código"}
          </Button>
        </div>
      </form>
    </AuthShell>
  )
}

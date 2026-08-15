"use client"

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { ApiError } from "@/core/http/errors"
import { useCompleteMercadoPagoAuthorization } from "../hooks/use-mercado-pago"
import { readCallbackParams } from "../model/mercado-pago.model"

/**
 * Where Mercado Pago drops the trainer after the authorisation screen.
 *
 * The code is exchanged for tokens by the backend, not here — that call needs
 * the client secret. This page's only job is to hand `code` and `state` over
 * once and report what happened.
 */
export function MercadoPagoCallback() {
  const params = useSearchParams()
  const { code, state, error } = readCallbackParams(params)

  const complete = useCompleteMercadoPagoAuthorization()
  const { mutate } = complete

  // React 19 in dev mounts effects twice, and an authorisation code is
  // single-use: the second exchange would fail and overwrite a successful
  // result with an error. The ref makes the call happen exactly once.
  const exchanged = useRef(false)

  useEffect(() => {
    if (exchanged.current || !code || !state) return
    exchanged.current = true
    mutate({ code, state })
  }, [code, state, mutate])

  if (error) {
    return (
      <CallbackState
        tone="error"
        title="No se ha completado la vinculación"
        description={
          error === "access_denied"
            ? "Has cancelado la autorización en Mercado Pago. Tu cuenta sigue sin vincular."
            : `Mercado Pago ha devuelto un error: ${error}`
        }
      />
    )
  }

  if (!code || !state) {
    return (
      <CallbackState
        tone="error"
        title="Enlace de vuelta incompleto"
        description="Faltan los parámetros que devuelve Mercado Pago. Vuelve a intentar la vinculación desde la pantalla de cobros."
      />
    )
  }

  if (complete.isPending || complete.isIdle) {
    return (
      <CallbackState
        tone="pending"
        title="Vinculando tu cuenta…"
        description="Estamos confirmando la autorización con Mercado Pago. No cierres esta pestaña."
      />
    )
  }

  if (complete.isError) {
    return (
      <CallbackState
        tone="error"
        title="No hemos podido guardar la vinculación"
        description={
          complete.error instanceof ApiError
            ? complete.error.message
            : "Inténtalo de nuevo desde la pantalla de cobros."
        }
      />
    )
  }

  return (
    <CallbackState
      tone="success"
      title="Cuenta vinculada"
      description={
        complete.data?.nickname
          ? `Los cobros de tus planes se acreditarán en ${complete.data.nickname}.`
          : "Ya puedes cobrar las suscripciones de tus alumnos."
      }
    />
  )
}

function CallbackState({
  tone,
  title,
  description,
}: {
  tone: "pending" | "success" | "error"
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-12 text-center">
      {tone === "pending" && <Loader2 className="size-8 animate-spin text-muted-foreground" />}
      {tone === "success" && <CheckCircle2 className="size-8 text-success-text" />}
      {tone === "error" && <AlertTriangle className="size-8 text-error-text" />}

      <div>
        <p className="font-heading text-subtitle font-semibold tracking-tight">{title}</p>
        <p className="mt-1 max-w-prose text-body text-muted-foreground text-pretty">
          {description}
        </p>
      </div>

      {tone !== "pending" && (
        <Button render={<Link href="/dashboard/payments" />}>Volver a cobros</Button>
      )}
    </div>
  )
}

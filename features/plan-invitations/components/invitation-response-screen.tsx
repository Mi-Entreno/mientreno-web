"use client"

import { Apple, CheckCircle2, CreditCard, Dumbbell, Loader2, ThumbsDown, Users, XCircle } from "lucide-react"
import { useState } from "react"

import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/core/http/errors"
import type { AuthBrandCopy } from "@/features/auth/components/auth-brand-panel"
import { AuthShell } from "@/features/auth/components/auth-shell"
import {
  billingLabel,
  billingSuffix,
} from "@/features/subscription-plans/model/subscription-plan.model"
import { formatCurrency } from "@/lib/format"
import {
  useAcceptInvitation,
  useInvitationByToken,
  useRejectInvitation,
} from "../hooks/use-invitation-response"
import { describeStatus, isEnrolled, type PlanInvitation } from "../model/plan-invitation.model"

const MAX_REASON_LENGTH = 300

/**
 * The visitor here is a student, not a trainer, so the branded panel sells the
 * thing they are actually being offered rather than the dashboard.
 */
const STUDENT_BRAND: AuthBrandCopy = {
  headline: (
    <>
      Tu plan te está
      <br />
      <span className="text-brand-green">esperando.</span>
    </>
  ),
  copy: "Revisa la propuesta de tu entrenador y respóndele en un minuto.",
  features: [
    { icon: Dumbbell, label: "Entrenamientos guiados semana a semana" },
    { icon: Apple, label: "Pauta de nutrición si tu plan la incluye" },
    { icon: Users, label: "Seguimiento directo de tu entrenador" },
  ],
  note: "© 2026 JJTECH",
}

/**
 * The student's half of the flow, opened from the link in their notification.
 *
 * This app is the trainer's dashboard, so the visitor here has no session and
 * never will: the token in the URL *is* the authorisation. That is why the page
 * shows the offer and nothing else — no roster, no other invitations, no way to
 * reach any other screen. The in-app inbox of pending invitations belongs to
 * the student's mobile app, against the authenticated endpoints in
 * `BACKEND_REQUIREMENTS.md` §3.5.
 */
export function InvitationResponseScreen({ token }: { token: string }) {
  const invitation = useInvitationByToken(token)
  const accept = useAcceptInvitation(token)
  const reject = useRejectInvitation(token)

  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")

  return (
    <AuthShell
      brand={STUDENT_BRAND}
      footer={
        <>
          ¿Eres entrenador? Entra en el panel desde{" "}
          <a
            href="/login"
            className="font-semibold text-primary-text underline underline-offset-4 hover:text-foreground"
          >
            mientreno.app/login
          </a>
          .
        </>
      }
    >
      {invitation.isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {invitation.isError && <LoadError error={invitation.error} />}

      {invitation.data && (
        <>
          {accept.isSuccess ? (
            <Accepted
              enrolled={accept.data.subscriptionStatus === "ACTIVE"}
              checkoutUrl={accept.data.checkoutUrl}
              trainerName={invitation.data.trainer.name}
            />
          ) : reject.isSuccess ? (
            <Rejected trainerName={invitation.data.trainer.name} />
          ) : invitation.data.status !== "PENDING" ? (
            <AlreadyAnswered invitation={invitation.data} />
          ) : (
            <Offer
              invitation={invitation.data}
              busy={accept.isPending || reject.isPending}
              accepting={accept.isPending}
              rejecting={rejecting}
              rejectPending={reject.isPending}
              reason={reason}
              error={accept.error ?? reject.error}
              onReasonChange={setReason}
              onStartReject={() => setRejecting(true)}
              onCancelReject={() => setRejecting(false)}
              onAccept={() => accept.mutate()}
              onConfirmReject={() => reject.mutate(reason)}
            />
          )}
        </>
      )}
    </AuthShell>
  )
}

function LoadError({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : null

  const message =
    status === 404 || status === 410
      ? "Esta invitación ya no existe o ha caducado. Pide a tu entrenador que te la envíe de nuevo."
      : error instanceof ApiError
        ? error.message
        : "No hemos podido cargar la invitación. Inténtalo de nuevo en unos minutos."

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <XCircle className="size-8 text-error-text" />
      <p className="max-w-prose text-body text-muted-foreground text-pretty">{message}</p>
    </div>
  )
}

function Offer({
  invitation,
  busy,
  accepting,
  rejecting,
  rejectPending,
  reason,
  error,
  onReasonChange,
  onStartReject,
  onCancelReject,
  onAccept,
  onConfirmReject,
}: {
  invitation: PlanInvitation
  busy: boolean
  accepting: boolean
  rejecting: boolean
  rejectPending: boolean
  reason: string
  error: unknown
  onReasonChange: (value: string) => void
  onStartReject: () => void
  onCancelReject: () => void
  onAccept: () => void
  onConfirmReject: () => void
}) {
  const { trainer, plan } = invitation

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <UserAvatar name={trainer.name} src={trainer.avatarUrl} className="size-12" />
        <div className="min-w-0">
          <h1 className="text-title font-semibold tracking-tight text-balance">
            {trainer.name} te propone un plan
          </h1>
          <p className="text-body text-muted-foreground">
            Para {invitation.student.name}
          </p>
        </div>
      </div>

      {invitation.message && (
        <blockquote className="rounded-xl border border-border bg-secondary/40 p-4 text-body text-muted-foreground text-pretty">
          “{invitation.message}”
        </blockquote>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(8,19,36,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-body-lg font-semibold tracking-tight">{plan.name}</p>
          <Badge variant="secondary">{billingLabel(plan.billingPeriod)}</Badge>
        </div>

        <p className="text-headline font-semibold tracking-tight">
          {formatCurrency(plan.price)}
          <span className="text-body font-normal text-muted-foreground">
            {billingSuffix(plan.billingPeriod)}
          </span>
        </p>

        {plan.description && (
          <p className="text-body text-muted-foreground text-pretty">{plan.description}</p>
        )}

        <ul className="flex flex-wrap gap-3 text-body text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Users className="size-4" />
            Seguimiento personalizado
          </li>
          {plan.includesNutrition && (
            <li className="flex items-center gap-1.5">
              <Apple className="size-4" />
              Incluye plan de nutrición
            </li>
          )}
        </ul>
      </div>

      {error !== null && error !== undefined && (
        <p className="rounded-lg border border-error/40 bg-error-surface p-3 text-body text-error-text text-pretty">
          {error instanceof ApiError
            ? error.message
            : "No se ha podido registrar tu respuesta. Inténtalo de nuevo."}
        </p>
      )}

      {rejecting ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">¿Quieres decirle por qué? (opcional)</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              value={reason}
              disabled={rejectPending}
              maxLength={MAX_REASON_LENGTH}
              placeholder="Prefiero esperar al mes que viene…"
              className="bg-card"
              onChange={(event) => onReasonChange(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onCancelReject} disabled={rejectPending}>
              Volver
            </Button>
            <Button variant="destructive" onClick={onConfirmReject} disabled={rejectPending}>
              {rejectPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar rechazo
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={onAccept} disabled={busy}>
            {accepting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Aceptar plan
          </Button>
          <Button variant="outline" size="lg" onClick={onStartReject} disabled={busy}>
            <ThumbsDown className="size-4" />
            Rechazar
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * The screen after answering yes — and the one place it is easiest to lie.
 *
 * Accepting does not make anyone a student: on a paid plan the subscription is
 * born `PENDING_PAYMENT` and only an approved payment activates it. So the
 * headline is driven by `enrolled` (the real subscription status the backend
 * returned), never by the fact that the mutation succeeded. A free plan comes
 * back `ACTIVE` and is the only case that may say "ya eres alumno".
 *
 * `checkoutUrl` null on a paid plan means the trainer has not linked Mercado
 * Pago yet — the subscription exists but nothing can be charged. Saying "your
 * trainer will contact you" is the honest version of that, and it is the state
 * `BACKEND_REQUIREMENTS.md` §5.6 asks the backend to prevent upstream.
 */
function Accepted({
  enrolled,
  checkoutUrl,
  trainerName,
}: {
  enrolled: boolean
  checkoutUrl: string | null
  trainerName: string
}) {
  if (enrolled) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle2 className="size-10 text-success-text" />
        <div>
          <h1 className="text-title font-semibold tracking-tight text-balance">
            ¡Ya eres alumno de {trainerName}!
          </h1>
          <p className="mt-2 max-w-prose text-body text-muted-foreground text-pretty">
            Tu suscripción está activa.
          </p>
        </div>

        <p className="text-caption text-muted-foreground text-pretty">
          Abre la app de Mi Entreno para ver tu plan de entrenamiento en cuanto tu entrenador lo
          publique.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <CreditCard className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-title font-semibold tracking-tight text-balance">
          Has aceptado la propuesta
        </h1>
        <p className="mt-2 max-w-prose text-body text-muted-foreground text-pretty">
          {checkoutUrl
            ? `Falta el pago para activar tu suscripción con ${trainerName}. Hasta entonces no serás alumno suyo.`
            : `${trainerName} todavía no puede recibir pagos. Se pondrá en contacto contigo para activar la suscripción.`}
        </p>
      </div>

      {checkoutUrl && (
        <Button size="lg" render={<a href={checkoutUrl} rel="noopener noreferrer" />}>
          <CreditCard className="size-4" />
          Pagar con Mercado Pago
        </Button>
      )}

      <p className="text-caption text-muted-foreground text-pretty">
        Puedes volver a este enlace para completar el pago cuando quieras.
      </p>
    </div>
  )
}

function Rejected({ trainerName }: { trainerName: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <ThumbsDown className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-title font-semibold tracking-tight text-balance">
          Has rechazado la propuesta
        </h1>
        <p className="mt-2 max-w-prose text-body text-muted-foreground text-pretty">
          Hemos avisado a {trainerName}. Si cambias de idea, pídele que te la vuelva a enviar.
        </p>
      </div>
    </div>
  )
}

/**
 * The invitation was answered on some earlier visit.
 *
 * The case that matters is coming back after (or during) the payment: the link
 * stays alive while the subscription is unpaid precisely so a reload, a
 * back-button or a return from Mercado Pago lands somewhere truthful. Re-using
 * `Accepted` means this screen and the just-accepted one cannot drift apart
 * about what "aceptada" means.
 */
function AlreadyAnswered({ invitation }: { invitation: PlanInvitation }) {
  if (invitation.status === "ACCEPTED") {
    return (
      <Accepted
        enrolled={isEnrolled(invitation)}
        checkoutUrl={invitation.checkoutUrl}
        trainerName={invitation.trainer.name}
      />
    )
  }

  const descriptor = describeStatus(invitation.status)

  const copy: Record<string, string> = {
    REJECTED: "Ya rechazaste esta invitación.",
    CANCELLED: `${invitation.trainer.name} ha retirado esta propuesta.`,
    EXPIRED: "Esta invitación ha caducado. Pide a tu entrenador que te la envíe de nuevo.",
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <CheckCircle2 className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-title font-semibold tracking-tight text-balance">
          Invitación {descriptor.label.toLowerCase()}
        </h1>
        <p className="mt-2 max-w-prose text-body text-muted-foreground text-pretty">
          {copy[invitation.status] ?? "Esta invitación ya no admite respuesta."}
        </p>
      </div>
    </div>
  )
}

"use client"

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Link2Off,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  useConnectMercadoPago,
  useDisconnectMercadoPago,
  useMercadoPagoConnection,
} from "../hooks/use-mercado-pago"
import {
  describeConnection,
  isOperational,
  needsReconnect,
  type MercadoPagoConnection,
} from "../model/mercado-pago.model"

/** Where Mercado Pago returns after the trainer authorises (or refuses). */
export const MERCADO_PAGO_REDIRECT_PATH = "/dashboard/payments/callback"

/**
 * Where the trainer links the account that will receive their students' money.
 *
 * Its own route rather than a card inside Ajustes: Ajustes is about the person
 * (name, preferences, deleting the account), and this is about the business —
 * it gates whether any plan can be charged at all, and both the plans screen
 * and the invitation wizard link here when it is missing.
 */
export function MercadoPagoScreen() {
  const connection = useMercadoPagoConnection()
  const connect = useConnectMercadoPago()
  const disconnect = useDisconnectMercadoPago()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  return (
    <div className="flex flex-col gap-8">
      <p className="text-body text-muted-foreground text-pretty">
        Mercado Pago es el proveedor de pagos de Mi Entreno. Vincula tu cuenta para que los
        alumnos que acepten uno de tus planes puedan pagarlo y el dinero se acredite directamente
        en tu cuenta.
      </p>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">
          Tu cuenta de Mercado Pago
        </h2>

        {connection.isLoading && <Skeleton className="h-44 w-full rounded-2xl" />}

        {connection.isError && (
          <ConnectionError error={connection.error} onRetry={() => connection.refetch()} />
        )}

        {connection.data && (
          <ConnectionCard
            connection={connection.data}
            connecting={connect.isPending}
            disconnecting={disconnect.isPending}
            onConnect={() => connect.mutate(MERCADO_PAGO_REDIRECT_PATH)}
            onDisconnect={() => setConfirmDisconnect(true)}
          />
        )}
      </section>

      <HowItWorks />

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="¿Desvincular tu cuenta de Mercado Pago?"
        description="Dejarás de poder cobrar suscripciones nuevas y las renovaciones automáticas se detendrán. Los cobros ya realizados no se ven afectados."
        confirmLabel="Desvincular"
        destructive
        loading={disconnect.isPending}
        onConfirm={() =>
          disconnect.mutate(undefined, { onSettled: () => setConfirmDisconnect(false) })
        }
      />
    </div>
  )
}

function ConnectionError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return <ErrorState error={error} context="load" onRetry={onRetry} inline />
}

const TONE_RING: Record<string, string> = {
  success: "border-success/40 bg-success-surface text-success-text",
  warning: "border-warning bg-warning-surface text-warning-text",
  danger: "border-error/40 bg-error-surface text-error-text",
  neutral: "border-border bg-secondary text-muted-foreground",
}

function ConnectionCard({
  connection,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: {
  connection: MercadoPagoConnection
  connecting: boolean
  disconnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}) {
  const descriptor = describeConnection(connection.status)
  const linked = connection.status !== "NOT_CONNECTED"
  const operational = isOperational(connection)

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl border",
              TONE_RING[descriptor.tone],
            )}
          >
            {operational ? (
              <CheckCircle2 className="size-5" />
            ) : linked ? (
              <AlertTriangle className="size-5" />
            ) : (
              <CreditCard className="size-5" />
            )}
          </div>

          <div className="min-w-0">
            <p className="font-heading text-body-lg font-semibold tracking-tight">
              {descriptor.label}
            </p>
            <p className="mt-1 max-w-prose text-body text-muted-foreground text-pretty">
              {descriptor.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(!linked || needsReconnect(connection)) && (
            <Button onClick={onConnect} disabled={connecting}>
              {connecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
              {needsReconnect(connection) ? "Volver a vincular" : "Vincular Mercado Pago"}
            </Button>
          )}

          {linked && (
            <Button variant="ghost" onClick={onDisconnect} disabled={disconnecting}>
              <Link2Off className="size-4" />
              Desvincular
            </Button>
          )}
        </div>
      </div>

      {linked && (
        <>
          <dl className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <Field label="Cuenta" value={connection.nickname ?? connection.email ?? "—"} />
            <Field label="Id de Mercado Pago" value={connection.accountId ?? "—"} />
            <Field
              label="Vinculada el"
              value={connection.connectedAt ? formatDate(connection.connectedAt) : "—"}
            />
            <Field
              label="Comisión de la plataforma"
              value={
                connection.applicationFeePercent === null
                  ? "—"
                  : `${connection.applicationFeePercent} % por cobro`
              }
            />
          </dl>

          {!connection.liveMode && (
            <p className="flex items-start gap-2 rounded-lg border border-warning bg-warning-surface p-3 text-body text-warning-text">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span className="text-pretty">
                Esta cuenta está en modo de pruebas de Mercado Pago. Los cobros no son reales
                mientras siga así.
              </span>
            </p>
          )}
        </>
      )}

      {!linked && (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-body text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span className="text-pretty">
            Te llevaremos a Mercado Pago para que autorices a Mi Entreno. Nunca vemos ni
            guardamos tu contraseña: solo un permiso que puedes retirar cuando quieras.
          </span>
        </p>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="truncate text-body font-medium">{value}</dd>
    </div>
  )
}

const STEPS = [
  {
    title: "Vinculas tu cuenta",
    body: "Autorizas a Mi Entreno desde Mercado Pago. Guardamos el permiso, no tus credenciales.",
  },
  {
    title: "El alumno acepta un plan",
    body: "Al aceptar la invitación se crea la suscripción y Mercado Pago le ofrece el pago.",
  },
  {
    title: "Cobras y te avisamos",
    body: "Mercado Pago nos notifica por webhook, la suscripción pasa a activa y recibes una notificación.",
  },
]

function HowItWorks() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-subtitle font-semibold tracking-tight">
        Cómo funciona el cobro
      </h2>

      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 font-heading text-body font-semibold text-primary-text">
              {index + 1}
            </span>
            <p className="font-medium">{step.title}</p>
            <p className="text-body text-muted-foreground text-pretty">{step.body}</p>
          </li>
        ))}
      </ol>

      <p className="flex items-start gap-2 text-body text-muted-foreground">
        <ExternalLink className="mt-0.5 size-4 shrink-0" />
        <span className="text-pretty">
          Los reintegros, contracargos y el detalle de cada movimiento se gestionan desde tu
          panel de Mercado Pago. Aquí solo verás el estado de cada suscripción.
        </span>
      </p>
    </section>
  )
}

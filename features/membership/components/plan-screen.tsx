"use client"

import { Check, Minus } from "lucide-react"
import { useEffect, useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { ErrorState } from "@/components/dashboard/error-state"
import { OptionGroup } from "@/components/shared/option-group"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { track } from "@/core/analytics/track"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  useCancelMembership,
  useCheckout,
  useMembershipPayments,
  useMembershipPlans,
  useMyMembership,
  useResumeMembership,
} from "../hooks/use-membership"
import {
  canCancel,
  canResume,
  describeBenefit,
  describeMembership,
  isStoreManaged,
  paidPlans,
  PERIOD_LABELS,
  priceFor,
  STATUS_LABELS,
  yearlySavingsPercent,
  type BillingPeriod,
  type MembershipPlan,
  type MyMembership,
} from "../model/membership.model"

const PERIOD_OPTIONS = [
  { value: "MONTHLY", label: "Mensual" },
  { value: "YEARLY", label: "Anual" },
] as const

/**
 * The trainer's plan with Mi Entreno: where they are, what Pro adds, and the
 * way in and out.
 *
 * Everything shown comes from the backend — names, prices, what each plan
 * includes — so changing a price or a limit from the admin changes this page
 * with no deploy. Cancelling is one click and a confirmation, as easy as
 * subscribing (that symmetry is a legal requirement in Argentina, not a nicety).
 */
export function PlanScreen() {
  const me = useMyMembership()
  const plans = useMembershipPlans()
  const [period, setPeriod] = useState<BillingPeriod>("MONTHLY")

  useEffect(() => track("PREMIUM_PAGE_OPENED", { surface: "plan" }), [])

  if (me.isLoading || plans.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }
  if (me.isError) return <ErrorState error={me.error} onRetry={() => me.refetch()} />
  if (plans.isError) return <ErrorState error={plans.error} onRetry={() => plans.refetch()} />
  if (!me.data || !plans.data) return null

  const freePlan = plans.data.find((plan) => plan.defaultPlan) ?? null
  const offers = paidPlans(plans.data)

  return (
    <div className="flex flex-col gap-8">
      <CurrentPlanCard me={me.data} />

      {offers.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-subtitle font-semibold tracking-tight">Planes</h2>
              <p className="mt-1 text-body text-muted-foreground">Precios en pesos argentinos, IVA incluido.</p>
            </div>
            <OptionGroup
              name="billing-period"
              label="Período de facturación"
              options={PERIOD_OPTIONS}
              value={period}
              onChange={setPeriod}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {freePlan && <PlanCard plan={freePlan} period={period} me={me.data} />}
            {offers.map((plan) => (
              <PlanCard key={plan.id} plan={plan} period={period} me={me.data} />
            ))}
          </div>
        </section>
      )}

      <PaymentsSection />
    </div>
  )
}

function CurrentPlanCard({ me }: { me: MyMembership }) {
  const cancel = useCancelMembership()
  const resume = useResumeMembership()
  const [confirming, setConfirming] = useState(false)
  const membership = me.membership

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption text-muted-foreground">Tu plan</p>
          <p className="font-heading text-title font-semibold tracking-tight">
            {membership?.planName ?? me.effectivePlanName ?? "Gratis"}
          </p>
        </div>
        {membership && (
          <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-caption font-medium">
            {STATUS_LABELS[membership.status]}
          </span>
        )}
      </div>

      <p className="max-w-prose text-body text-muted-foreground text-pretty">
        {membership ? describeMembership(membership) : "Estás en el plan gratuito. Podés pasarte a Pro cuando quieras."}
      </p>

      <div className="flex flex-wrap gap-2">
        {membership?.status === "PENDING" && membership.checkoutUrl && (
          <Button onClick={() => window.location.assign(membership.checkoutUrl!)}>Completar el pago</Button>
        )}
        {canResume(membership) && (
          <Button onClick={() => resume.mutate()} disabled={resume.isPending}>
            Reactivar la renovación
          </Button>
        )}
        {isStoreManaged(membership) && (
          <p className="text-caption text-muted-foreground text-pretty">
            Lo compraste desde la app: la renovación y la baja se gestionan en App Store o Google Play.
          </p>
        )}
        {canCancel(membership) && (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            {membership?.status === "PENDING" ? "Cancelar el pago pendiente" : "Dar de baja"}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="¿Dar de baja tu plan?"
        description={
          membership?.status === "PENDING"
            ? "Se descarta el pago que dejaste sin terminar."
            : "No se te va a cobrar más. Seguís teniendo los beneficios hasta el final del período que ya pagaste, y podés reactivarlo antes de esa fecha."
        }
        confirmLabel="Dar de baja"
        destructive
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate(undefined, { onSettled: () => setConfirming(false) })}
      />
    </section>
  )
}

function PlanCard({ plan, period, me }: { plan: MembershipPlan; period: BillingPeriod; me: MyMembership }) {
  const checkout = useCheckout()
  const price = priceFor(plan, period)
  const savings = period === "YEARLY" ? yearlySavingsPercent(plan) : null
  const hasLiveMembership = me.membership !== null && me.membership.status !== "PENDING"
  const trialDays = me.trialEligible && price ? price.trialDays : 0

  return (
    <article
      className={cn(
        "flex flex-col gap-5 rounded-2xl border bg-card p-6",
        plan.current ? "border-primary" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-subtitle font-semibold tracking-tight">{plan.name}</h3>
          {plan.description && <p className="mt-1 text-body text-muted-foreground text-pretty">{plan.description}</p>}
        </div>
        {plan.current ? (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-medium text-primary-text">
            Tu plan
          </span>
        ) : (
          plan.highlightLabel && (
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-caption font-medium">
              {plan.highlightLabel}
            </span>
          )
        )}
      </div>

      <div>
        {plan.defaultPlan ? (
          <p className="font-heading text-title font-semibold">$ 0</p>
        ) : price ? (
          <>
            <p className="font-heading text-title font-semibold">
              {formatCurrency(price.amount)}
              <span className="ml-1 font-sans text-body font-normal text-muted-foreground">
                / {period === "MONTHLY" ? "mes" : "año"}
              </span>
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              {[price.label, savings ? `Ahorrás ${savings} %` : null, trialDays > 0 ? `${trialDays} días gratis` : null]
                .filter(Boolean)
                .join(" · ") || PERIOD_LABELS[period]}
            </p>
          </>
        ) : (
          <p className="text-body text-muted-foreground">No disponible en este período.</p>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {plan.benefits.map((benefit) => (
          <li key={benefit.featureCode} className="flex items-start gap-2 text-body">
            {benefit.enabled ? (
              <Check className="mt-0.5 size-4 shrink-0 text-success-text" />
            ) : (
              <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={cn(!benefit.enabled && "text-muted-foreground")}>
              {benefit.name}
              <span className="text-muted-foreground"> — {describeBenefit(benefit)}</span>
            </span>
          </li>
        ))}
      </ul>

      {!plan.defaultPlan && !plan.current && price && (
        <div className="mt-auto flex flex-col gap-2">
          <Button
            onClick={() => checkout.mutate(price.id)}
            disabled={!me.billingEnabled || hasLiveMembership || checkout.isPending}
          >
            {trialDays > 0 ? `Probar ${trialDays} días gratis` : `Pasarme a ${plan.name}`}
          </Button>
          <p className="text-caption text-muted-foreground text-pretty">
            {!me.billingEnabled
              ? "Muy pronto vas a poder suscribirte desde acá."
              : hasLiveMembership
                ? "Ya tenés un plan en curso."
                : "Pagás con Mercado Pago y se renueva solo. Podés darlo de baja cuando quieras."}
          </p>
        </div>
      )}
    </article>
  )
}

function PaymentsSection() {
  const payments = useMembershipPayments()
  if (!payments.data || payments.data.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-subtitle font-semibold tracking-tight">Pagos</h2>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {payments.data.map((payment) => (
          <li key={payment.id} className="flex items-center justify-between gap-3 px-5 py-3 text-body">
            <span>{formatDate(payment.paidAt ?? payment.periodStart ?? undefined)}</span>
            <span className="text-muted-foreground">{payment.status === "APPROVED" ? "Aprobado" : "No cobrado"}</span>
            <span className="font-medium">{formatCurrency(payment.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

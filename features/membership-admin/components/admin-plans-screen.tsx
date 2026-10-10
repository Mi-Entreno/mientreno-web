"use client"

import { Pencil } from "lucide-react"
import { useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { OptionGroup } from "@/components/shared/option-group"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { describeBenefit, PERIOD_LABELS, type BillingPeriod } from "@/features/membership/model/membership.model"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  useAddPrice,
  useAdminMembershipPlans,
  useRemoveEntitlement,
  useSetEntitlement,
  useSetStoreProducts,
  useUpdatePlan,
} from "../hooks/use-membership-admin"
import {
  AUDIENCE_LABELS,
  canPublish,
  groupByAudience,
  parseLimit,
  type MembershipPlan,
  type PlanBenefit,
} from "../model/membership-admin.model"

const PERIODS = [
  { value: "MONTHLY", label: "Mensual" },
  { value: "YEARLY", label: "Anual" },
] as const

/**
 * Prices, limits and publication of every plan, without a deploy.
 *
 * What is *not* here, on purpose: editing a price in place (a new one closes the
 * old, so a membership's history still shows what was charged), deactivating a
 * free plan (an audience would be left with no plan), and creating features
 * (they need code that checks them).
 */
export function AdminPlansScreen() {
  const plans = useAdminMembershipPlans()

  if (plans.isError) return <ErrorState error={plans.error} onRetry={() => plans.refetch()} />
  if (plans.isLoading || !plans.data) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-prose text-body text-muted-foreground text-pretty">
        Los cambios rigen desde el próximo pedido de cada usuario y quedan registrados con tu nombre. Un precio nuevo
        no le cambia nada a quien ya pagaba.
      </p>
      {groupByAudience(plans.data).map((group) => (
        <section key={group.audience} className="flex flex-col gap-4">
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">{AUDIENCE_LABELS[group.audience]}</h2>
          {group.plans.map((plan) => (
            <PlanAdminCard key={plan.id} plan={plan} />
          ))}
        </section>
      ))}
    </div>
  )
}

function PlanAdminCard({ plan }: { plan: MembershipPlan }) {
  const update = useUpdatePlan()
  const [editing, setEditing] = useState<PlanBenefit | null>(null)
  const publishable = canPublish(plan)

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-heading text-subtitle font-semibold">{plan.name}</p>
          <p className="text-caption text-muted-foreground">
            {plan.code}
            {plan.defaultPlan && " · plan por defecto"}
          </p>
        </div>
        {!plan.defaultPlan && (
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-body">
              <Switch
                checked={plan.visible}
                disabled={update.isPending || (!plan.visible && !publishable)}
                onCheckedChange={(visible) => update.mutate({ planId: plan.id, patch: { visible } })}
              />
              Publicado
            </label>
            <label className="flex items-center gap-2 text-body">
              <Switch
                checked={plan.active}
                disabled={update.isPending}
                onCheckedChange={(active) => update.mutate({ planId: plan.id, patch: { active } })}
              />
              Se puede contratar
            </label>
          </div>
        )}
      </div>
      {!plan.defaultPlan && !publishable && (
        <p className="text-caption text-warning-text">Cargá un precio para poder publicarlo.</p>
      )}

      {!plan.defaultPlan && <PricesSection plan={plan} />}

      <div className="flex flex-col gap-2">
        <h3 className="text-body font-semibold">Beneficios</h3>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {plan.benefits.map((benefit) => (
            <li key={benefit.featureCode} className="flex items-center justify-between gap-3 px-4 py-2.5 text-body">
              <div className="min-w-0">
                <p className="truncate">{benefit.name}</p>
                <p className="text-caption text-muted-foreground">
                  {describeBenefit(benefit)}
                  {!benefit.fromPlan && " · valor por defecto"}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Editar ${benefit.name}`} onClick={() => setEditing(benefit)}>
                <Pencil />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {editing && <BenefitDialog plan={plan} benefit={editing} onClose={() => setEditing(null)} />}
    </article>
  )
}

function PricesSection({ plan }: { plan: MembershipPlan }) {
  const addPrice = useAddPrice()
  const [period, setPeriod] = useState<BillingPeriod>("MONTHLY")
  const [amount, setAmount] = useState("")
  const [trialDays, setTrialDays] = useState("")
  const [label, setLabel] = useState("")
  const parsedAmount = Number(amount.replace(/\./g, "").replace(",", "."))
  const valid = amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount >= 1

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid) return
    addPrice.mutate(
      {
        planId: plan.id,
        price: {
          billingPeriod: period,
          amount: parsedAmount,
          trialDays: trialDays ? Number(trialDays) : 0,
          label: label.trim() || undefined,
        },
      },
      { onSuccess: () => { setAmount(""); setTrialDays(""); setLabel("") } },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-body font-semibold">Precios</h3>
      {plan.prices.length > 0 && (
        <ul className="flex flex-col gap-1 text-body">
          {plan.prices.map((price) => (
            <li key={price.id} className={cn("flex flex-wrap gap-x-3", !price.active && "text-muted-foreground line-through")}>
              <span className="w-20">{PERIOD_LABELS[price.billingPeriod]}</span>
              <span className="font-medium">{formatCurrency(price.amount)}</span>
              {price.trialDays > 0 && <span>{price.trialDays} días gratis</span>}
              {price.label && <span>{price.label}</span>}
              <span className="text-caption text-muted-foreground no-underline">desde {formatDate(price.validFrom)}</span>
              {price.active && <StoreProductsEditor price={price} />}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4">
        <p className="text-caption text-muted-foreground">Nuevo precio (reemplaza al vigente del período)</p>
        <OptionGroup name={`period-${plan.id}`} label="Período" options={PERIODS} value={period} onChange={setPeriod} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`amount-${plan.id}`}>Monto (ARS)</Label>
            <Input id={`amount-${plan.id}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`trial-${plan.id}`}>Días de prueba</Label>
            <Input id={`trial-${plan.id}`} inputMode="numeric" value={trialDays} onChange={(e) => setTrialDays(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`label-${plan.id}`}>Etiqueta</Label>
            <Input id={`label-${plan.id}`} placeholder="Precio de lanzamiento" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
        </div>
        <Button type="submit" size="sm" className="w-fit" disabled={!valid || addPrice.isPending}>
          Guardar precio
        </Button>
      </form>
    </div>
  )
}

/**
 * Which App Store / Google Play product is this price. The amount in the store
 * is set in each store's console, not here: the mobile app shows the store's
 * localized price. This only tells the backend which plan a purchase buys.
 */
function StoreProductsEditor({ price }: { price: MembershipPlan["prices"][number] }) {
  const save = useSetStoreProducts()
  const [open, setOpen] = useState(false)
  const [appStore, setAppStore] = useState(price.appStoreProductId ?? "")
  const [playStore, setPlayStore] = useState(price.playStoreProductId ?? "")

  return (
    <>
      <button type="button" className="text-caption text-primary-text underline-offset-4 hover:underline" onClick={() => setOpen(true)}>
        {price.appStoreProductId || price.playStoreProductId ? "Tiendas ✓" : "Asociar a las tiendas"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Productos de tienda</DialogTitle>
            <DialogDescription>
              Qué producto de cada tienda es este precio. El monto lo fija cada tienda en su consola.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`app-store-${price.id}`}>App Store (product id)</Label>
            <Input id={`app-store-${price.id}`} value={appStore} onChange={(e) => setAppStore(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`play-store-${price.id}`}>Google Play (producto:planBase)</Label>
            <Input id={`play-store-${price.id}`} value={playStore} onChange={(e) => setPlayStore(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              disabled={save.isPending}
              onClick={() =>
                save.mutate(
                  {
                    priceId: price.id,
                    body: { appStoreProductId: appStore.trim() || null, playStoreProductId: playStore.trim() || null },
                  },
                  { onSuccess: () => setOpen(false) },
                )
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function BenefitDialog({ plan, benefit, onClose }: { plan: MembershipPlan; benefit: PlanBenefit; onClose: () => void }) {
  const setEntitlement = useSetEntitlement()
  const removeEntitlement = useRemoveEntitlement()
  const [enabled, setEnabled] = useState(benefit.enabled)
  const [limit, setLimit] = useState(benefit.fromPlan && benefit.limit !== null ? String(benefit.limit) : "")
  const parsed = parseLimit(limit)
  const takesLimit = benefit.type !== "BOOLEAN"

  const save = () => {
    if (!parsed.ok) return
    setEntitlement.mutate(
      { planId: plan.id, featureCode: benefit.featureCode, body: { enabled, limit: takesLimit ? parsed.value : null } },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{benefit.name}</DialogTitle>
          <DialogDescription>
            {plan.name} · {benefit.description ?? benefit.featureCode}
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-center gap-2 text-body">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          Incluido en el plan
        </label>

        {takesLimit && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="benefit-limit">
              {benefit.type === "CONFIG" ? "Valor" : "Límite"}
              {benefit.unit ? ` (${benefit.unit})` : ""}
            </Label>
            <Input
              id="benefit-limit"
              inputMode="numeric"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              aria-invalid={!parsed.ok}
            />
            <p className="text-caption text-muted-foreground">
              {benefit.type === "CONFIG"
                ? "Vacío: rige la configuración general."
                : "Vacío: ilimitado. Bajar un límite no le quita nada a nadie: sólo frena altas nuevas."}
            </p>
          </div>
        )}

        <DialogFooter>
          {benefit.fromPlan && (
            <Button
              variant="ghost"
              disabled={removeEntitlement.isPending}
              onClick={() =>
                removeEntitlement.mutate({ planId: plan.id, featureCode: benefit.featureCode }, { onSuccess: onClose })
              }
            >
              Volver al valor por defecto
            </Button>
          )}
          <Button onClick={save} disabled={!parsed.ok || setEntitlement.isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

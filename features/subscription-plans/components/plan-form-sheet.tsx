"use client"

import { useState, type FormEvent } from "react"

import { OptionGroup } from "@/components/shared/option-group"
import { BarsLoader } from "@/components/ui/bars-loader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/core/http/errors"
import { CURRENCY_SYMBOL } from "@/lib/format"
import {
  BILLING_PERIODS,
  emptyPlanForm,
  type BillingPeriod,
  type PlanFormValues,
  type SubscriptionPlan,
} from "../model/subscription-plan.model"
import { toPlanFormValues } from "../mappers/subscription-plan.mapper"
import { useCreatePlan, useUpdatePlan } from "../hooks/use-subscription-plans"

interface PlanFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null creates a new plan. */
  plan: SubscriptionPlan | null
}

export function PlanFormSheet({ open, onOpenChange, plan }: PlanFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        {/* Keyed so switching between plans reseeds the fields. */}
        {open && <PlanForm key={plan?.id ?? "new"} plan={plan} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function PlanForm({ plan, onDone }: { plan: SubscriptionPlan | null; onDone: () => void }) {
  const isEditing = plan !== null
  const [values, setValues] = useState<PlanFormValues>(
    plan ? toPlanFormValues(plan) : emptyPlanForm(),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const create = useCreatePlan()
  const update = useUpdatePlan()
  const mutation = isEditing ? update : create

  const serverErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {}
  const allErrors = { ...serverErrors, ...errors }

  function patch(next: Partial<PlanFormValues>) {
    setValues((current) => ({ ...current, ...next }))
  }

  function validate(): boolean {
    const found: Record<string, string> = {}

    if (!values.name.trim()) found.name = "El nombre es obligatorio"

    // `price` is @NotNull @Positive upstream, so zero is rejected too.
    const price = Number(values.price.replace(",", "."))
    if (!values.price.trim()) found.price = "El precio es obligatorio"
    else if (!Number.isFinite(price)) found.price = "Ingresá un número válido"
    else if (price <= 0) found.price = "El precio debe ser mayor a 0"

    if (values.maxStudents.trim()) {
      const max = Number(values.maxStudents)
      if (!Number.isInteger(max) || max < 1) {
        found.maxStudents = "Ingresá un número entero de al menos 1"
      }
    }

    setErrors(found)
    return Object.keys(found).length === 0
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    if (isEditing) {
      update.mutate({ planId: plan.id, values }, { onSuccess: onDone })
    } else {
      create.mutate(values, { onSuccess: onDone })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col" noValidate>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Editar plan" : "Nuevo plan de suscripción"}</SheetTitle>
        <SheetDescription>
          Definí el precio y la periodicidad a la que se suscribirán tus alumnos.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-name">
            Nombre <span className="text-error-text">*</span>
          </Label>
          <Input
            id="plan-name"
            value={values.name}
            disabled={mutation.isPending}
            placeholder="Plan Premium"
            onChange={(event) => patch({ name: event.target.value })}
          />
          {allErrors.name && <p className="text-body text-error-text">{allErrors.name}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-description">Descripción</Label>
          <Textarea
            id="plan-description"
            rows={3}
            value={values.description}
            disabled={mutation.isPending}
            placeholder="Qué incluye el plan: sesiones, seguimiento, revisiones…"
            onChange={(event) => patch({ description: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Periodicidad</Label>
          <OptionGroup
            name="billingPeriod"
            label="Periodicidad"
            options={BILLING_PERIODS.map((item) => ({ value: item.value, label: item.label }))}
            value={values.billingPeriod}
            disabled={mutation.isPending}
            onChange={(billingPeriod: BillingPeriod) => patch({ billingPeriod })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-price">
              Precio <span className="text-error-text">*</span>
            </Label>
            {/*
              El símbolo solo no dice qué moneda es: `formatCurrency` renderiza
              pesos argentinos en todo el resto del panel, y el entrenador está
              fijando el número que el alumno va a pagar.
            */}
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-body text-muted-foreground"
              >
                {CURRENCY_SYMBOL}
              </span>
              <Input
                id="plan-price"
                inputMode="decimal"
                value={values.price}
                disabled={mutation.isPending}
                placeholder="25000"
                className="pl-7"
                aria-describedby="plan-price-hint"
                onChange={(event) => patch({ price: event.target.value })}
              />
            </div>
            <p id="plan-price-hint" className="text-caption text-muted-foreground">
              En pesos argentinos (ARS).
            </p>
            {allErrors.price && <p className="text-body text-error-text">{allErrors.price}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-max">Plazas máximas</Label>
            <Input
              id="plan-max"
              inputMode="numeric"
              value={values.maxStudents}
              disabled={mutation.isPending}
              placeholder="Sin límite"
              onChange={(event) => patch({ maxStudents: event.target.value })}
            />
            {allErrors.maxStudents && (
              <p className="text-body text-error-text">{allErrors.maxStudents}</p>
            )}
            <p className="text-caption text-muted-foreground">
              Dejalo vacío para no limitar las altas.
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
          <div>
            <Label htmlFor="plan-nutrition">Incluye nutrición</Label>
            <p className="mt-1 text-caption text-muted-foreground">
              Los alumnos de este plan podrán recibir plan nutricional.
            </p>
          </div>
          <Switch
            id="plan-nutrition"
            checked={values.includesNutrition}
            disabled={mutation.isPending}
            onCheckedChange={(checked: boolean) => patch({ includesNutrition: checked })}
          />
        </div>
      </div>

      <SheetFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <BarsLoader />}
          {isEditing ? "Guardar cambios" : "Crear plan"}
        </Button>
      </SheetFooter>
    </form>
  )
}

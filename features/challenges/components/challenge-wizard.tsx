"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Gift, Loader2, Plus, Target, Trash2 } from "lucide-react"
import { useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { SaveChallengeInput } from "../dto/challenge.dto"
import { useCreateChallenge, useUpdateChallenge } from "../hooks/use-challenges"
import {
  FAMILY_LABELS,
  METRIC_OPTIONS,
  MODE_OPTIONS,
  metricOption,
  type BrandChallenge,
} from "../model/challenge.model"

/**
 * Un desafío y su recompensa, en un solo flujo.
 *
 * Antes esto eran dos altas separadas —el admin creaba el desafío, el comercio
 * cargaba el producto— y nada las relacionaba salvo una moneda en el medio. Los
 * tres pasos siguen el orden en que el comercio piensa la promesa: qué tiene que
 * lograr el alumno, qué se lleva, y cómo se lee todo junto.
 */
type Step = "challenge" | "reward" | "review"

const STEPS: { id: Step; label: string }[] = [
  { id: "challenge", label: "Desafío" },
  { id: "reward", label: "Recompensa" },
  { id: "review", label: "Revisión" },
]

const requirementSchema = z.object({
  metric: z.string().min(1, "Elegí qué medir"),
  targetValue: z.coerce
    .number({ message: "Indicá el objetivo" })
    .int("Tiene que ser un número entero")
    .min(1, "El objetivo mínimo es 1"),
})

const schema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
    description: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    terms: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    startDate: z.string().min(1, "Indicá desde cuándo se puede aceptar"),
    endDate: z.string().min(1, "Indicá hasta cuándo se puede completar"),
    requirementMode: z.enum(["ALL", "ANY", "N_OF_M"]),
    requiredCount: z.coerce.number().int().min(1).nullish(),
    // Sin `.min(1)`: un desafío puede no tener condiciones si cuesta repes — el
    // alumno lo compra en vez de entrenarlo. La regla real ("una condición O un
    // costo") es cruzada y vive en el refine de más abajo, igual que en
    // `ChallengeAuthoringService.validate`.
    requirements: z.array(requirementSchema),
    repsCost: z.coerce
      .number({ message: "Indicá el costo en repes" })
      .int("Tiene que ser un número entero")
      .min(0, "El costo no puede ser negativo"),
    rewardName: z.string().trim().min(1, "La recompensa necesita un nombre").max(150, "Máximo 150 caracteres"),
    rewardDescription: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    rewardTerms: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    rewardExpirationDate: z.string().min(1, "Indicá hasta cuándo vale la recompensa"),
    rewardStock: z.coerce
      .number({ message: "Indicá cuántas unidades hay" })
      .int("Tiene que ser un número entero")
      .min(1, "Tiene que haber al menos una unidad"),
  })
  // La regla que reemplaza al `.min(1)` de requirements. El mensaje ofrece las
  // dos salidas porque las dos son válidas.
  //
  // Se ancla en `repsCost` y no en `requirements` por una razón concreta: con
  // `useFieldArray`, react-hook-form guarda el error de nivel array en
  // `errors.requirements.root` y no en `errors.requirements.message`, así que
  // el mensaje no se renderizaba. `repsCost` es un campo común, está justo
  // encima de la lista, y el texto nombra igual las dos salidas.
  .refine((values) => values.requirements.length > 0 || values.repsCost > 0, {
    message: "Agregá una condición, o ponele un costo en repes: sin ninguna de las dos, se lo lleva el primero",
    path: ["repsCost"],
  })
  .refine((values) => values.requirementMode !== "N_OF_M" || values.requirements.length > 0, {
    message: "N_OF_M pide cumplir N de varias condiciones, y no cargaste ninguna",
    path: ["requirementMode"],
  })
  .refine((values) => values.requirementMode !== "N_OF_M" || !!values.requiredCount, {
    message: "Indicá cuántas condiciones hay que cumplir",
    path: ["requiredCount"],
  })
  .refine(
    (values) => values.requirementMode !== "N_OF_M" || (values.requiredCount ?? 0) <= values.requirements.length,
    { message: "Pedís más condiciones de las que cargaste", path: ["requiredCount"] },
  )
  .refine((values) => values.endDate >= values.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  })
  // El backend lo vuelve a validar con un CHECK: si la recompensa venciera antes,
  // habría alumnos entrenando por un premio que ya no van a poder canjear.
  .refine((values) => values.rewardExpirationDate >= values.endDate, {
    message: "La recompensa no puede vencer antes que el desafío",
    path: ["rewardExpirationDate"],
  })
  // Dos condiciones que miden la misma actividad no agregan esfuerzo: piden lo
  // mismo dos veces. El backend rechaza el alta por el mismo motivo.
  .superRefine((values, ctx) => {
    const seen = new Map<string, number>()
    values.requirements.forEach((requirement, index) => {
      const family = metricOption(requirement.metric as never)?.family
      if (!family) return
      if (seen.has(family)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requirements", index, "metric"],
          message: `Ya hay otra condición que mide ${FAMILY_LABELS[family]}`,
        })
      }
      seen.set(family, index)
    })
  })

type FormValues = z.input<typeof schema>

function emptyForm(): FormValues {
  const hoy = new Date()
  const enUnMes = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
  const enDosMeses = new Date(hoy.getTime() + 60 * 24 * 60 * 60 * 1000)
  return {
    name: "",
    description: "",
    terms: "",
    startDate: iso(hoy),
    endDate: iso(enUnMes),
    requirementMode: "ALL",
    requiredCount: null,
    requirements: [{ metric: "WORKOUTS_COMPLETED", targetValue: 5 }],
    repsCost: 0,
    rewardName: "",
    rewardDescription: "",
    rewardTerms: "",
    rewardExpirationDate: iso(enDosMeses),
    rewardStock: 20,
  }
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

interface ChallengeWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge?: BrandChallenge | null
}

export function ChallengeWizard({ open, onOpenChange, challenge }: ChallengeWizardProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {/* Con key: reabrir nunca retoma un desafío a medio cargar. */}
        {open && (
          <WizardForm
            key={challenge?.id ?? "nuevo"}
            challenge={challenge ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function WizardForm({ challenge, onDone }: { challenge: BrandChallenge | null; onDone: () => void }) {
  const [step, setStep] = useState<Step>("challenge")
  const isEditing = challenge !== null

  const create = useCreateChallenge()
  const update = useUpdateChallenge()
  const pending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: challenge ? toFormValues(challenge) : emptyForm(),
  })

  const { fields, append, remove } = useFieldArray({ control, name: "requirements" })
  const requirementMode = useWatch({ control, name: "requirementMode" })
  const requirements = useWatch({ control, name: "requirements" })

  /** Las familias ya usadas. `Agregar` arranca en una libre; ver `availableMetrics`. */
  const usedFamilies = new Set(
    (requirements ?? [])
      .map((requirement) => metricOption(requirement?.metric as never)?.family)
      .filter(Boolean) as string[],
  )

  async function goNext() {
    if (step === "challenge") {
      const ok = await trigger([
        "name",
        "startDate",
        "endDate",
        "requirements",
        "requirementMode",
        "requiredCount",
        "repsCost",
      ])
      if (ok) setStep("reward")
      return
    }
    if (step === "reward") {
      const ok = await trigger(["rewardName", "rewardExpirationDate", "rewardStock"])
      if (ok) setStep("review")
    }
  }

  function goBack() {
    if (step === "review") setStep("reward")
    else if (step === "reward") setStep("challenge")
  }

  function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    const input: SaveChallengeInput = {
      name: parsed.name,
      description: parsed.description || undefined,
      terms: parsed.terms || undefined,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      requirementMode: parsed.requirementMode,
      requiredCount: parsed.requirementMode === "N_OF_M" ? parsed.requiredCount : null,
      requirements: parsed.requirements.map((requirement, index) => ({
        metric: requirement.metric as SaveChallengeInput["requirements"][number]["metric"],
        targetValue: requirement.targetValue,
        sortOrder: index,
      })),
      rewardName: parsed.rewardName,
      rewardDescription: parsed.rewardDescription || undefined,
      rewardTerms: parsed.rewardTerms || undefined,
      rewardExpirationDate: parsed.rewardExpirationDate,
      rewardStock: parsed.rewardStock,
      repsCost: parsed.repsCost,
    }

    const action = isEditing
      ? update.mutateAsync({ id: challenge.id, input })
      : create.mutateAsync(input)

    action.then(onDone).catch(() => {})
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col" noValidate>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Editar desafío" : "Nuevo desafío"}</SheetTitle>
        <SheetDescription>
          Definí qué tiene que lograr el alumno y qué se lleva al conseguirlo.
        </SheetDescription>
      </SheetHeader>

      <Stepper current={step} />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
        {step === "challenge" && (
          <>
            <Field label="Nombre" error={errors.name?.message}>
              <Input id="name" placeholder="Constancia de acero" disabled={pending} {...register("name")} />
            </Field>

            <Field label="Descripción" error={errors.description?.message}>
              <Textarea
                id="description"
                rows={2}
                placeholder="Entrená cinco veces este mes y llevate un café."
                disabled={pending}
                {...register("description")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Se puede aceptar desde" error={errors.startDate?.message}>
                <Input id="startDate" type="date" disabled={pending} {...register("startDate")} />
              </Field>
              <Field label="Hasta" error={errors.endDate?.message}>
                <Input id="endDate" type="date" disabled={pending} {...register("endDate")} />
              </Field>
            </div>

            <Field
              label="Costo en repes"
              error={errors.repsCost?.message}
              hint="Lo que el alumno gasta para desbloquearlo. Las repes las gana entrenando y en la ruleta. Dejalo en 0 para que sea gratis."
            >
              {/* aria-label explícito, como los inputs de las condiciones: el
                  <Label> de Field no lleva htmlFor, así que sin esto el campo
                  queda sin nombre accesible. */}
              <Input
                id="repsCost"
                type="number"
                min={0}
                aria-label="Costo en repes"
                disabled={pending}
                {...register("repsCost")}
              />
            </Field>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>Condiciones</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending || fields.length >= METRIC_OPTIONS.length}
                  onClick={() => append({ metric: firstFreeMetric(usedFamilies), targetValue: 10 })}
                >
                  <Plus className="size-4" /> Agregar
                </Button>
              </div>
              <p className="text-caption text-muted-foreground">
                {fields.length === 0
                  ? "Sin condiciones, el desafío se desbloquea sólo pagando repes: el esfuerzo ya lo hizo juntándolas."
                  : "Lo que el alumno tiene que lograr entrenando. El sistema lo mide solo, desde el día que lo desbloquea."}
              </p>

              {fields.map((field, index) => (
                <div key={field.id} className="grid items-start gap-2 [grid-template-columns:minmax(0,1fr)_7rem_2.25rem]">
                  <div className="flex flex-col gap-1">
                    <Select
                      items={METRIC_OPTIONS}
                      value={requirements?.[index]?.metric ?? ""}
                      onValueChange={(value) =>
                        setValue(`requirements.${index}.metric`, String(value), { shouldValidate: true })
                      }
                      disabled={pending}
                    >
                      <SelectTrigger className="w-full" aria-label="Qué medir">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMetrics(requirements, index).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.requirements?.[index]?.metric && (
                      <p className="text-caption text-error-text">
                        {errors.requirements[index]?.metric?.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Input
                      type="number"
                      min={1}
                      aria-label="Objetivo"
                      disabled={pending}
                      {...register(`requirements.${index}.targetValue`)}
                    />
                    {errors.requirements?.[index]?.targetValue && (
                      <p className="text-caption text-error-text">
                        {errors.requirements[index]?.targetValue?.message}
                      </p>
                    )}
                  </div>
                  {/* Se puede quitar la última: un desafío sin condiciones es
                      válido mientras tenga costo, y el refine cruzado del schema
                      es el que avisa cuando no lo tiene. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => remove(index)}
                    aria-label="Quitar condición"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {errors.requirements?.message && (
                <p className="text-caption text-error-text">{errors.requirements.message}</p>
              )}
            </div>

            {fields.length > 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="¿Cuáles hay que cumplir?">
                  <Select
                    items={MODE_OPTIONS}
                    value={requirementMode}
                    onValueChange={(value) =>
                      setValue("requirementMode", value as FormValues["requirementMode"], { shouldValidate: true })
                    }
                    disabled={pending}
                  >
                    <SelectTrigger id="requirementMode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {requirementMode === "N_OF_M" && (
                  <Field label="¿Cuántas?" error={errors.requiredCount?.message}>
                    <Input type="number" min={1} disabled={pending} {...register("requiredCount")} />
                  </Field>
                )}
              </div>
            )}
          </>
        )}

        {step === "reward" && (
          <>
            <Field label="Qué se lleva" error={errors.rewardName?.message}>
              <Input
                id="rewardName"
                placeholder="20% OFF en toda la tienda"
                disabled={pending}
                {...register("rewardName")}
              />
            </Field>

            <Field label="Descripción" error={errors.rewardDescription?.message}>
              <Textarea id="rewardDescription" rows={2} disabled={pending} {...register("rewardDescription")} />
            </Field>

            <Field label="Condiciones de uso" error={errors.rewardTerms?.message}>
              <Textarea
                id="rewardTerms"
                rows={2}
                placeholder="No acumulable con otras promociones. De lunes a jueves."
                disabled={pending}
                {...register("rewardTerms")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Unidades"
                error={errors.rewardStock?.message}
                hint="Es también el cupo: cada alumno que acepta reserva una."
              >
                <Input type="number" min={1} disabled={pending} {...register("rewardStock")} />
              </Field>
              <Field
                label="La recompensa vence"
                error={errors.rewardExpirationDate?.message}
                hint="Nunca antes que el desafío."
              >
                <Input type="date" disabled={pending} {...register("rewardExpirationDate")} />
              </Field>
            </div>
          </>
        )}

        {step === "review" && <ReviewStep control={control} onEdit={setStep} />}
      </div>

      <SheetFooter className="flex-row justify-between gap-2">
        <Button type="button" variant="ghost" onClick={step === "challenge" ? onDone : goBack} disabled={pending}>
          {step === "challenge" ? (
            "Cancelar"
          ) : (
            <>
              <ArrowLeft className="size-4" /> Atrás
            </>
          )}
        </Button>

        {step === "review" ? (
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Guardar" : "Crear borrador"}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={pending}>
            Siguiente
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}

/** La promesa completa, leída como la va a leer el alumno. */
function ReviewStep({
  control,
  onEdit,
}: {
  control: ReturnType<typeof useForm<FormValues>>["control"]
  onEdit: (step: Step) => void
}) {
  const values = useWatch({ control })

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <header className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-heading text-subtitle uppercase">
            <Target className="size-4" /> El desafío
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit("challenge")}>
            Editar
          </Button>
        </header>
        <p className="text-body-strong">{values.name || "Sin nombre"}</p>
        {values.description && <p className="text-body text-muted-foreground">{values.description}</p>}
        {Number(values.repsCost ?? 0) > 0 && (
          <p className="mt-2 text-body-strong tabular-nums">
            Cuesta {String(values.repsCost)} repes
          </p>
        )}
        {(values.requirements ?? []).length === 0 ? (
          <p className="mt-2 text-body text-muted-foreground">
            Sin condiciones: se desbloquea sólo pagando.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {(values.requirements ?? []).map((requirement, index) => {
              const option = metricOption(requirement?.metric as never)
              return (
                <li key={index} className="text-body tabular-nums">
                  {String(requirement?.targetValue ?? "")} {option?.unit ?? ""}
                  <span className="text-muted-foreground"> · {option?.label}</span>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-2 text-caption text-muted-foreground tabular-nums">
          Del {values.startDate} al {values.endDate}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <header className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-heading text-subtitle uppercase">
            <Gift className="size-4" /> La recompensa
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit("reward")}>
            Editar
          </Button>
        </header>
        <p className="text-body-strong">{values.rewardName || "Sin nombre"}</p>
        {values.rewardDescription && (
          <p className="text-body text-muted-foreground">{values.rewardDescription}</p>
        )}
        {values.rewardTerms && <p className="text-caption text-muted-foreground">{values.rewardTerms}</p>}
        <p className="mt-2 text-caption text-muted-foreground tabular-nums">
          {String(values.rewardStock ?? "")} unidades · vence el {values.rewardExpirationDate}
        </p>
      </section>

      <p className="text-body text-muted-foreground">
        Así lo va a leer el alumno:{" "}
        <strong>
          {(values.requirements ?? []).length === 0
            ? "pagá estas repes y llevate esta recompensa"
            : Number(values.repsCost ?? 0) > 0
              ? "pagá estas repes, completá el desafío y llevate esta recompensa"
              : "completá este desafío y llevate esta recompensa"}
        </strong>
        . Se publica desde la lista, cuando estés conforme.
      </p>
    </div>
  )
}

function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <ol className="flex items-center gap-2 px-4 py-3">
      {STEPS.map((step, index) => (
        <li key={step.id} className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-caption tabular-nums",
              index <= currentIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {index + 1}
          </span>
          <span className={cn("text-caption", index === currentIndex && "text-body-strong")}>{step.label}</span>
          {index < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
        </li>
      ))}
    </ol>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-caption text-muted-foreground">{hint}</p>}
      {error && <p className="text-caption text-error-text">{error}</p>}
    </div>
  )
}

/** La primera métrica de una familia todavía libre. */
function firstFreeMetric(usedFamilies: Set<string>): string {
  return METRIC_OPTIONS.find((option) => !usedFamilies.has(option.family))?.value ?? "SETS_COMPLETED"
}

/**
 * Qué puede elegir esta condición: todo menos las familias que ocupan las otras.
 *
 * Es la misma regla que el `superRefine` del esquema y que el backend, pero
 * aplicada antes: ofrecer una opción que va a dar error y avisar después es
 * pedirle al comercio que descubra la restricción probando. La propia métrica
 * de la fila queda siempre en la lista, o el selector no podría mostrar lo que
 * ya tiene elegido.
 */
function availableMetrics(
  requirements: { metric?: string }[] | undefined,
  index: number,
): typeof METRIC_OPTIONS {
  const takenByOthers = new Set(
    (requirements ?? [])
      .filter((_, other) => other !== index)
      .map((requirement) => metricOption(requirement?.metric as never)?.family)
      .filter(Boolean) as string[],
  )
  const own = requirements?.[index]?.metric

  return METRIC_OPTIONS.filter(
    (option) => option.value === own || !takenByOthers.has(option.family),
  )
}

function toFormValues(challenge: BrandChallenge): FormValues {
  return {
    name: challenge.name,
    description: challenge.description ?? "",
    terms: challenge.terms ?? "",
    startDate: challenge.startsAt.slice(0, 10),
    endDate: challenge.endsAt.slice(0, 10),
    requirementMode: challenge.requirementMode,
    requiredCount: challenge.requiredCount,
    requirements: challenge.requirements.map((requirement) => ({
      metric: requirement.metric,
      targetValue: requirement.targetValue,
    })),
    rewardName: challenge.reward.name,
    rewardDescription: challenge.reward.description ?? "",
    rewardTerms: challenge.reward.terms ?? "",
    rewardExpirationDate: challenge.reward.expiresAt.slice(0, 10),
    rewardStock: challenge.reward.stock,
    repsCost: challenge.repsCost,
  }
}

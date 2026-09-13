"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useEffect } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type { RewardMetricType, RewardMetricWindow } from "../dto/admin.dto"
import { useCreateChallenge, useUpdateChallenge } from "../hooks/use-admin"
import type { AdminChallenge } from "../model/admin.model"
import { METRIC_OPTIONS } from "../model/challenge.model"

/**
 * El tope de premio que valida el backend (`rewards.challenges.max-prize-reps`).
 *
 * Duplicado acá para poder avisar en el formulario en vez de dejar que el 400
 * explique la regla después de escribir todo. El backend sigue siendo la
 * autoridad: si el valor cambia allá, acá sólo se desactualiza el aviso.
 */
const MAX_PRIZE_REPS = 500

const requirementSchema = z
  .object({
    metric: z.string().min(1, "Elegí qué medir"),
    targetValue: z.coerce
      .number({ message: "Indicá el objetivo" })
      .int("Tiene que ser un número entero")
      .min(1, "El objetivo mínimo es 1"),
    window: z.enum(["LIFETIME", "LAST_N_DAYS", "SINCE_CHALLENGE_START"]),
    windowDays: z.coerce.number().int().min(1).max(365).nullish(),
  })
  .refine((value) => value.window !== "LAST_N_DAYS" || !!value.windowDays, {
    message: "Indicá de cuántos días",
    path: ["windowDays"],
  })

const schema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
    description: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    prizeReps: z.coerce
      .number({ message: "Indicá el premio en repes" })
      .int("Tiene que ser un número entero")
      .min(1, "El premio mínimo es 1 repe")
      .max(MAX_PRIZE_REPS, `El premio máximo es ${MAX_PRIZE_REPS} repes`),
    requirementMode: z.enum(["ALL", "ANY", "N_OF_M"]),
    requiredCount: z.coerce.number().int().min(1).nullish(),
    maxGrants: z.coerce.number().int().min(1).nullish(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    requirements: z.array(requirementSchema).min(1, "Agregá al menos un requisito"),
  })
  .refine((value) => value.requirementMode !== "N_OF_M" || !!value.requiredCount, {
    message: "Indicá cuántos requisitos hay que cumplir",
    path: ["requiredCount"],
  })
  .refine(
    (value) =>
      value.requirementMode !== "N_OF_M" ||
      !value.requiredCount ||
      value.requiredCount <= value.requirements.length,
    { message: "Pedís más requisitos de los que cargaste", path: ["requiredCount"] },
  )
  .refine((value) => !value.validFrom || !value.validTo || value.validTo >= value.validFrom, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["validTo"],
  })

type FormValues = z.input<typeof schema>

const EMPTY_REQUIREMENT = {
  metric: "SETS_COMPLETED" as RewardMetricType,
  targetValue: 100,
  window: "LIFETIME" as RewardMetricWindow,
  windowDays: null,
}

function emptyForm(): FormValues {
  return {
    name: "",
    description: "",
    prizeReps: 50,
    requirementMode: "ALL",
    requiredCount: null,
    maxGrants: null,
    validFrom: "",
    validTo: "",
    requirements: [{ ...EMPTY_REQUIREMENT }],
  }
}

/**
 * Alta y edición de un desafío.
 *
 * Dos cosas que el formulario tiene que dejar claras, porque son las que no se
 * adivinan mirando los campos:
 *
 * 1. **El premio crea repes.** No las mueve de un lado a otro: las acuña, y las cobra
 *    todo el que cumpla. Por eso hay un techo, y el aviso va al lado del campo en vez
 *    de escondido en un tooltip o descubierto como un 400.
 * 2. **Los requisitos se congelan** en cuanto alguien gana el desafío. Editar el
 *    objetivo con gente a mitad de camino sería mover el arco, así que a esa altura
 *    sólo se puede corregir el nombre, la descripción y la vigencia.
 */
export function ChallengeFormDialog({
  open,
  challenge,
  onClose,
}: {
  open: boolean
  challenge: AdminChallenge | null
  onClose: () => void
}) {
  const create = useCreateChallenge()
  const update = useUpdateChallenge()
  const isEditing = challenge !== null
  const conditionsLocked = isEditing && !challenge.editableRequirements

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyForm() })

  const { fields, append, remove } = useFieldArray({ control, name: "requirements" })
  const mode = useWatch({ control, name: "requirementMode" })
  const requirements = useWatch({ control, name: "requirements" })

  useEffect(() => {
    if (!open) return
    reset(
      challenge
        ? {
            name: challenge.name,
            description: challenge.description ?? "",
            prizeReps: challenge.prizeReps,
            requirementMode: challenge.requirementMode,
            requiredCount: challenge.requiredCount,
            maxGrants: challenge.maxGrants,
            validFrom: challenge.validFrom ?? "",
            validTo: challenge.validTo ?? "",
            requirements: challenge.requirements.map((requirement) => ({
              metric: requirement.metric,
              targetValue: requirement.targetValue,
              window: requirement.window,
              windowDays: requirement.windowDays,
            })),
          }
        : emptyForm(),
    )
  }, [open, challenge, reset])

  const pending = create.isPending || update.isPending

  function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    const input = {
      name: parsed.name,
      description: parsed.description || undefined,
      prizeReps: parsed.prizeReps,
      requirementMode: parsed.requirementMode,
      requiredCount: parsed.requirementMode === "N_OF_M" ? parsed.requiredCount : null,
      maxGrants: parsed.maxGrants ?? null,
      validFrom: parsed.validFrom || null,
      validTo: parsed.validTo || null,
      active: challenge?.active ?? true,
      requirements: parsed.requirements.map((requirement) => ({
        metric: requirement.metric as RewardMetricType,
        targetValue: requirement.targetValue,
        window: requirement.window,
        // El backend rechaza los días con cualquier otra ventana, así que se
        // limpian acá en vez de mandarlos y traducir el 400.
        windowDays: requirement.window === "LAST_N_DAYS" ? (requirement.windowDays ?? null) : null,
      })),
    }

    const mutation = isEditing
      ? update.mutateAsync({ id: challenge.id, input })
      : create.mutateAsync(input)

    void mutation.then(onClose).catch(() => {
      // El toast lo muestra el hook; el diálogo queda abierto para corregir.
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar desafío" : "Nuevo desafío"}</DialogTitle>
          <DialogDescription>
            {conditionsLocked
              ? "Ya lo ganó alguien: podés corregir el nombre, la descripción y la vigencia, pero no el premio ni los requisitos. Para cambiar las condiciones, creá un desafío nuevo."
              : isEditing && challenge.approvalStatus === "APPROVED"
                ? "Está publicado: al guardar sigue publicado, y los cambios se ven al instante."
                : "Definí qué premiás y qué tiene que lograr el alumno. Después lo publicás."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="challenge-name">Nombre</Label>
            <Input
              id="challenge-name"
              placeholder="Constancia de acero"
              disabled={pending}
              {...register("name")}
            />
            {errors.name && <p className="text-caption text-error-text">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="challenge-description">Descripción</Label>
            <Textarea
              id="challenge-description"
              rows={2}
              disabled={pending}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-caption text-error-text">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="challenge-prize">Premio en repes</Label>
              <Input
                id="challenge-prize"
                type="number"
                min={1}
                max={MAX_PRIZE_REPS}
                step={1}
                disabled={pending || conditionsLocked}
                {...register("prizeReps")}
              />
              <p className="text-caption text-muted-foreground">
                Máximo {MAX_PRIZE_REPS} repes. Estas repes se crean: el alumno las gana sin
                gastar nada, y las cobra todo el que cumpla.
              </p>
              {errors.prizeReps && (
                <p className="text-caption text-error-text">{errors.prizeReps.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="challenge-max-grants">Cupo (opcional)</Label>
              <Input
                id="challenge-max-grants"
                type="number"
                min={1}
                step={1}
                placeholder="Sin límite"
                disabled={pending}
                {...register("maxGrants")}
              />
              <p className="text-caption text-muted-foreground">
                Cuántos alumnos pueden ganarlo en total.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="challenge-valid-from">Desde (opcional)</Label>
              <Input id="challenge-valid-from" type="date" disabled={pending} {...register("validFrom")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="challenge-valid-to">Hasta (opcional)</Label>
              <Input id="challenge-valid-to" type="date" disabled={pending} {...register("validTo")} />
              {errors.validTo && (
                <p className="text-caption text-error-text">{errors.validTo.message}</p>
              )}
            </div>
          </div>

          {/* ── Requisitos ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-body-strong">Requisitos</p>
                <p className="text-caption text-muted-foreground">
                  Lo que el alumno tiene que lograr entrenando. El sistema lo calcula solo.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending || conditionsLocked}
                onClick={() => append({ ...EMPTY_REQUIREMENT })}
              >
                <Plus className="size-4" />
                Agregar
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_7rem_9rem_auto]">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`requirement-metric-${index}`} className="text-caption">
                    Qué se mide
                  </Label>
                  <Select
                    value={requirements?.[index]?.metric ?? "SETS_COMPLETED"}
                    onValueChange={(value) =>
                      setValue(`requirements.${index}.metric`, value as RewardMetricType, {
                        shouldValidate: true,
                      })
                    }
                    disabled={pending || conditionsLocked}
                  >
                    <SelectTrigger id={`requirement-metric-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`requirement-target-${index}`} className="text-caption">
                    Objetivo
                  </Label>
                  <Input
                    id={`requirement-target-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    disabled={pending || conditionsLocked}
                    {...register(`requirements.${index}.targetValue`)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`requirement-window-${index}`} className="text-caption">
                    Período
                  </Label>
                  <Select
                    value={requirements?.[index]?.window ?? "LIFETIME"}
                    onValueChange={(value) =>
                      setValue(`requirements.${index}.window`, value as RewardMetricWindow, {
                        shouldValidate: true,
                      })
                    }
                    disabled={pending || conditionsLocked}
                  >
                    <SelectTrigger id={`requirement-window-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LIFETIME">Desde siempre</SelectItem>
                      <SelectItem value="LAST_N_DAYS">Últimos N días</SelectItem>
                      <SelectItem value="SINCE_CHALLENGE_START">Desde que empieza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  {requirements?.[index]?.window === "LAST_N_DAYS" && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`requirement-days-${index}`} className="text-caption">
                        Días
                      </Label>
                      <Input
                        id={`requirement-days-${index}`}
                        type="number"
                        min={1}
                        max={365}
                        step={1}
                        className="w-20"
                        disabled={pending || conditionsLocked}
                        {...register(`requirements.${index}.windowDays`)}
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar requisito"
                    disabled={pending || conditionsLocked || fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}

            {errors.requirements?.message && (
              <p className="text-caption text-error-text">{errors.requirements.message}</p>
            )}
            {Array.isArray(errors.requirements) &&
              errors.requirements.some(Boolean) && (
                <p className="text-caption text-error-text">
                  Revisá los requisitos: el objetivo tiene que ser un número mayor a 0 y, con
                  «Últimos N días», hay que indicar cuántos.
                </p>
              )}
          </div>

          {/* ── Cuántos hacen falta ──────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="challenge-mode">¿Cuántos requisitos hay que cumplir?</Label>
              <Select
                value={mode ?? "ALL"}
                onValueChange={(value) =>
                  setValue("requirementMode", value as FormValues["requirementMode"], {
                    shouldValidate: true,
                  })
                }
                disabled={pending || conditionsLocked}
              >
                <SelectTrigger id="challenge-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ANY">Cualquiera</SelectItem>
                  <SelectItem value="N_OF_M">Algunos (N de M)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "N_OF_M" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="challenge-required-count">¿Cuántos?</Label>
                <Input
                  id="challenge-required-count"
                  type="number"
                  min={1}
                  max={fields.length}
                  step={1}
                  disabled={pending || conditionsLocked}
                  {...register("requiredCount")}
                />
                {errors.requiredCount && (
                  <p className="text-caption text-error-text">{errors.requiredCount.message}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Landmark, Loader2, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import {
  useBankTransferInfo,
  useDeleteBankTransferInfo,
  useSaveBankTransferInfo,
} from "../hooks/use-bank-transfers"
import { isValidCbu } from "../model/cbu"

/**
 * Where the trainer publishes the account their students transfer to.
 *
 * The CBU is validated here with the same check-digit rule the backend uses.
 * Not as a substitute for the server check — it runs there too — but because
 * the failure it catches is the one that matters most: a mistyped CBU sends a
 * student's money to an account that is not the trainer's, and nothing in this
 * product can get it back. Catching it before it is ever published is worth the
 * duplicated rule.
 */
const schema = z.object({
  accountHolder: z.string().trim().min(1, "Indicá el titular de la cuenta").max(150),
  bankName: z.string().trim().min(1, "Indicá el banco").max(100),
  alias: z
    .string()
    .trim()
    .max(20, "El alias no puede superar los 20 caracteres")
    .refine((value) => value === "" || value.length >= 6, "El alias tiene al menos 6 caracteres")
    .refine(
      (value) => value === "" || /^[A-Za-z0-9.\-]+$/.test(value),
      "El alias sólo admite letras, números, puntos y guiones",
    ),
  cbu: z
    .string()
    .trim()
    .regex(/^\d{22}$/, "El CBU tiene 22 dígitos")
    .refine(isValidCbu, "Revisá el CBU: algún dígito no coincide"),
  taxId: z
    .string()
    .trim()
    .max(20)
    .refine((value) => value === "" || /^[\d-]+$/.test(value), "Sólo números y guiones"),
  instructions: z.string().trim().max(500, "Máximo 500 caracteres"),
  enabled: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
  accountHolder: "",
  bankName: "",
  alias: "",
  cbu: "",
  taxId: "",
  instructions: "",
  enabled: true,
}

export function BankInfoForm() {
  const info = useBankTransferInfo()
  const save = useSaveBankTransferInfo()
  const remove = useDeleteBankTransferInfo()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })
  const { register, handleSubmit, reset, setValue, control, formState } = form
  // useWatch y no form.watch(): el segundo devuelve una función nueva en cada
  // render y no se puede memoizar.
  const enabled = useWatch({ control, name: "enabled" })

  useEffect(() => {
    if (!info.data) return
    reset({
      accountHolder: info.data.accountHolder,
      bankName: info.data.bankName,
      alias: info.data.alias ?? "",
      cbu: info.data.cbu,
      taxId: info.data.taxId ?? "",
      instructions: info.data.instructions ?? "",
      enabled: info.data.enabled,
    })
  }, [info.data, reset])

  if (info.isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />

  const onSubmit = handleSubmit((values) =>
    save.mutate({
      accountHolder: values.accountHolder,
      bankName: values.bankName,
      alias: values.alias || null,
      cbu: values.cbu,
      taxId: values.taxId || null,
      instructions: values.instructions || null,
      enabled: values.enabled,
    }),
  )

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground">
          <Landmark className="size-5" />
        </div>
        <div>
          <p className="font-heading text-body-lg font-semibold tracking-tight">
            Datos para transferencias
          </p>
          <p className="mt-1 max-w-prose text-body text-muted-foreground text-pretty">
            Tus alumnos ven estos datos cuando eligen pagarte por transferencia. El dinero entra
            directo en tu cuenta y vos confirmás cada pago desde acá.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Titular de la cuenta" error={formState.errors.accountHolder?.message}>
          <Input {...register("accountHolder")} placeholder="Juan Pérez" autoComplete="off" />
        </Field>

        <Field label="Banco" error={formState.errors.bankName?.message}>
          <Input {...register("bankName")} placeholder="Banco Galicia" autoComplete="off" />
        </Field>

        <Field label="Alias" hint="Opcional" error={formState.errors.alias?.message}>
          <Input {...register("alias")} placeholder="juan.entrena" autoComplete="off" />
        </Field>

        <Field label="CBU" error={formState.errors.cbu?.message}>
          <Input
            {...register("cbu")}
            placeholder="0000000000000000000000"
            inputMode="numeric"
            maxLength={22}
            autoComplete="off"
            // Pegar un CBU copiado del homebanking trae espacios y guiones;
            // rechazarlo por eso sería culpar al usuario del formato ajeno.
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text").replace(/\D/g, "")
              if (pasted) {
                event.preventDefault()
                setValue("cbu", pasted.slice(0, 22), { shouldValidate: true })
              }
            }}
          />
        </Field>

        <Field label="CUIT o DNI" hint="Opcional" error={formState.errors.taxId?.message}>
          <Input {...register("taxId")} placeholder="20-12345678-9" autoComplete="off" />
        </Field>
      </div>

      <Field
        label="Instrucciones adicionales"
        hint="Opcional"
        error={formState.errors.instructions?.message}
      >
        <Textarea
          {...register("instructions")}
          rows={3}
          placeholder="Transferí el importe exacto y después cargá el comprobante."
        />
      </Field>

      <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
        <span className="text-body">
          <span className="font-medium">Aceptar transferencias</span>
          <span className="mt-0.5 block text-muted-foreground text-pretty">
            Desactivalo para dejar de ofrecer este método sin borrar tus datos.
          </span>
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => setValue("enabled", checked, { shouldDirty: true })}
        />
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        {info.data && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            disabled={remove.isPending}
          >
            <Trash2 className="size-4" />
            Eliminar datos
          </Button>
        )}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar datos bancarios
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar tus datos bancarios?"
        description="Tus alumnos dejarán de ver la transferencia como método de pago. Los cobros ya aprobados no se ven afectados."
        confirmLabel="Eliminar"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSettled: () => {
              setConfirmDelete(false)
              reset(EMPTY)
            },
          })
        }
      />
    </form>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-baseline gap-2">
        {label}
        {hint && <span className="text-caption font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
      {error && <p className="text-caption text-error-text">{error}</p>}
    </div>
  )
}

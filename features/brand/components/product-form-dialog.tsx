"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { Textarea } from "@/components/ui/textarea"

import { useCreateProduct, useUpdateProduct } from "../hooks/use-brand"
import type { BrandProduct } from "../model/brand.model"

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
  description: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
  costReps: z.coerce
    .number({ message: "Indicá el costo en repes" })
    .int("Tiene que ser un número entero")
    .min(1, "El costo mínimo es 1 repe"),
  stock: z.coerce
    .number({ message: "Indicá el stock" })
    .int("Tiene que ser un número entero")
    .min(0, "El stock no puede ser negativo"),
})

type FormValues = z.input<typeof schema>

/**
 * Alta y edición de un producto.
 *
 * El stock se pide en el alta y después se ajusta desde la tabla, por delta:
 * mandar un valor absoluto mientras el backend procesa un canje pisaría el
 * descuento y regalaría una unidad. En la edición el campo no aparece por eso
 * mismo.
 */
export function ProductFormDialog({
  open,
  product,
  onClose,
}: {
  open: boolean
  product: BrandProduct | null
  onClose: () => void
}) {
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const isEditing = product !== null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", costReps: 1, stock: 0 },
  })

  useEffect(() => {
    if (!open) return
    reset(
      product
        ? {
            name: product.name,
            description: product.description ?? "",
            costReps: product.costReps,
            stock: product.stock,
          }
        : { name: "", description: "", costReps: 1, stock: 0 },
    )
  }, [open, product, reset])

  const pending = create.isPending || update.isPending

  function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    const input = {
      name: parsed.name,
      description: parsed.description || undefined,
      costReps: parsed.costReps,
      // En la edición el stock lo maneja el ajuste por delta; se reenvía el
      // actual para no cambiarlo desde acá.
      stock: isEditing ? product.stock : parsed.stock,
      active: product?.active ?? true,
    }

    const mutation = isEditing
      ? update.mutateAsync({ id: product.id, input })
      : create.mutateAsync(input)

    void mutation.then(onClose).catch(() => {
      // El toast lo muestra el hook; el diálogo queda abierto para corregir.
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {isEditing && product.approvalStatus === "APPROVED"
              ? "Este producto está publicado: al guardar vuelve a revisión, porque cambia lo que se ofrece."
              : "Después vas a poder subirle una foto y enviarlo a revisión."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-name">Nombre</Label>
            <Input id="product-name" disabled={pending} {...register("name")} />
            {errors.name && <p className="text-caption text-error-text">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-description">Descripción</Label>
            <Textarea id="product-description" rows={3} disabled={pending} {...register("description")} />
            {errors.description && (
              <p className="text-caption text-error-text">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-cost">Costo en repes</Label>
              <Input
                id="product-cost"
                type="number"
                min={1}
                step={1}
                disabled={pending}
                {...register("costReps")}
              />
              {errors.costReps && (
                <p className="text-caption text-error-text">{errors.costReps.message}</p>
              )}
            </div>

            {!isEditing && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-stock">Stock inicial</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min={0}
                  step={1}
                  disabled={pending}
                  {...register("stock")}
                />
                {errors.stock && <p className="text-caption text-error-text">{errors.stock.message}</p>}
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

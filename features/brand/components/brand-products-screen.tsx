"use client"

import { Gift, ImagePlus, Minus, Pause, Play, Plus, Send } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { ProductApprovalStatus } from "../dto/brand.dto"
import {
  useAdjustStock,
  useBrandProducts,
  useSetProductActive,
  useSubmitProduct,
  useUploadProductImage,
} from "../hooks/use-brand"
import {
  APPROVAL_LABELS,
  APPROVAL_TONES,
  notLiveReason,
  type BrandProduct,
} from "../model/brand.model"
import { ProductFormDialog } from "./product-form-dialog"
import { StatusPill } from "./status-pill"

const FILTERS: { label: string; value: ProductApprovalStatus | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Borradores", value: "DRAFT" },
  { label: "En revisión", value: "PENDING_APPROVAL" },
  { label: "Publicados", value: "APPROVED" },
  { label: "Rechazados", value: "REJECTED" },
]

export function BrandProductsScreen() {
  const [filter, setFilter] = useState<ProductApprovalStatus | undefined>(undefined)
  const [editing, setEditing] = useState<BrandProduct | null>(null)
  const [creating, setCreating] = useState(false)

  const query = useBrandProducts(filter)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <Button
              key={option.label}
              variant={filter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nuevo producto
        </Button>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} context="load" onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (query.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={Gift}
          title={filter ? "No hay productos en este estado" : "Todavía no cargaste productos"}
          description="Cargá tu primer producto, subile una foto y enviálo a revisión. Cuando lo aprobemos, los alumnos van a poder canjearlo."
          actionLabel={filter ? undefined : "Cargar producto"}
          onAction={filter ? undefined : () => setCreating(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((product) => (
                <ProductRow key={product.id} product={product} onEdit={() => setEditing(product)} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormDialog
        open={creating || editing !== null}
        product={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function ProductRow({ product, onEdit }: { product: BrandProduct; onEdit: () => void }) {
  const submit = useSubmitProduct()
  const adjustStock = useAdjustStock()
  const setActive = useSetProductActive()
  const uploadImage = useUploadProductImage()
  const fileInput = useRef<HTMLInputElement>(null)

  const blocked = notLiveReason(product)

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt=""
                width={44}
                height={44}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <Gift className="size-4 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0">
            <button
              type="button"
              onClick={onEdit}
              className="truncate text-left font-medium underline-offset-4 hover:underline"
            >
              {product.name}
            </button>
            {/* El motivo del rechazo va junto al producto y no escondido en un
                detalle: es lo que hay que corregir. */}
            {product.rejectionReason && (
              <p className="text-caption text-error-text text-pretty">{product.rejectionReason}</p>
            )}
            {blocked && (
              <p className="text-caption text-muted-foreground">
                Publicado, pero no visible: {blocked.toLowerCase()}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <StatusPill tone={APPROVAL_TONES[product.approvalStatus]}>
          {APPROVAL_LABELS[product.approvalStatus]}
        </StatusPill>
      </TableCell>

      <TableCell className="text-right tabular-nums">{product.costReps}</TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Restar una unidad de ${product.name}`}
            disabled={adjustStock.isPending || product.stock <= 0}
            onClick={() => adjustStock.mutate({ id: product.id, delta: -1 })}
          >
            <Minus />
          </Button>
          <span className="min-w-6 text-center tabular-nums">{product.stock}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Sumar una unidad de ${product.name}`}
            disabled={adjustStock.isPending}
            onClick={() => adjustStock.mutate({ id: product.id, delta: 1 })}
          >
            <Plus />
          </Button>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-1">
          {/* La imagen se sube desde acá porque sin ella el producto no se puede
              enviar a revisión, y esconderlo en el formulario hacía que el botón
              de enviar rebotara sin explicar por qué. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) uploadImage.mutate({ id: product.id, file })
              event.target.value = ""
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Cambiar la imagen de ${product.name}`}
            disabled={uploadImage.isPending}
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus />
          </Button>

          {product.approvalStatus === "APPROVED" && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={product.active ? `Pausar ${product.name}` : `Reanudar ${product.name}`}
              disabled={setActive.isPending}
              onClick={() => setActive.mutate({ id: product.id, active: !product.active })}
            >
              {product.active ? <Pause /> : <Play />}
            </Button>
          )}

          {product.canSubmit && (
            <Button
              size="sm"
              disabled={submit.isPending}
              onClick={() => submit.mutate(product.id)}
              className={cn(!product.imageUrl && "opacity-70")}
            >
              <Send />
              Enviar
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

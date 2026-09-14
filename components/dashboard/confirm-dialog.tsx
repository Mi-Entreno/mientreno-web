"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  /**
   * Un campo que la confirmación necesita, si lo necesita.
   *
   * "Agregar unidades" es confirmar *y* decir cuántas: sin esto haría falta un
   * diálogo propio para pedir un solo número, que es la forma de terminar con
   * dos componentes que se parecen y se comportan distinto.
   */
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  destructive,
  loading,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-pretty">{description}</DialogDescription>
        </DialogHeader>
        {children && <div className="flex flex-col gap-3">{children}</div>}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDeleteAccount } from "../hooks/use-delete-account"

const CONFIRMATION = "ELIMINAR"

/**
 * `DELETE /api/account` — soft-deletes the user and revokes every refresh
 * token upstream.
 *
 * Gated behind typing a confirmation word as well as a dialog: the action ends
 * the session everywhere and cannot be undone from this app.
 */
export function DeleteAccountCard() {
  const [typed, setTyped] = useState("")
  const [open, setOpen] = useState(false)
  const remove = useDeleteAccount()

  const canDelete = typed.trim().toUpperCase() === CONFIRMATION

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <div>
        <h3 className="font-heading text-body-lg font-semibold tracking-tight">Eliminar cuenta</h3>
        <p className="mt-1 text-body text-muted-foreground text-pretty">
          Se cerrará tu sesión en todos los dispositivos y perderás el acceso a tus alumnos y
          planes. Esta acción no se puede deshacer desde aquí.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="delete-confirm">
          Escribe <span className="font-mono font-semibold">{CONFIRMATION}</span> para confirmar
        </Label>
        <Input
          id="delete-confirm"
          value={typed}
          disabled={remove.isPending}
          onChange={(event) => setTyped(event.target.value)}
          className="sm:max-w-xs"
          autoComplete="off"
        />
      </div>

      <Button
        variant="destructive"
        disabled={!canDelete || remove.isPending}
        onClick={() => setOpen(true)}
        className="self-start"
      >
        Eliminar mi cuenta
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="¿Eliminar tu cuenta?"
        description="Tus alumnos dejarán de tener acceso a sus planes y se revocarán todas tus sesiones. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}

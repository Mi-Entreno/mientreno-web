"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSaveEconomy } from "../hooks/use-economy-admin"
import { diffEconomy, type EconomyConfig } from "../model/economy-admin.model"

/**
 * The last step before a change that moves every student's earnings at once:
 * read back what changes, say why, confirm. The note goes to the history.
 */
export function SaveEconomyDialog({
  saved,
  draft,
  onClose,
  onSaved,
}: {
  saved: EconomyConfig
  draft: EconomyConfig
  onClose: () => void
  onSaved: () => void
}) {
  const save = useSaveEconomy()
  const [note, setNote] = useState("")
  const changes = diffEconomy(saved, draft)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guardar la economía</DialogTitle>
          <DialogDescription>
            Rige desde el próximo movimiento de cada alumno. Lo que ya se acreditó no cambia, y la versión actual queda en
            el historial para restaurarla.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-3 text-body">
          {changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="economy-note">Motivo (queda en el historial)</Label>
          <Textarea
            id="economy-note"
            maxLength={300}
            placeholder="Ej.: ajuste al modelo de puntos V2 tras el primer mes de beta"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Seguir editando
          </Button>
          <Button
            disabled={save.isPending}
            onClick={() =>
              save.mutate({ config: draft, note: note.trim() || undefined }, { onSuccess: () => onSaved() })
            }
          >
            {save.isPending ? "Guardando…" : "Guardar y aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

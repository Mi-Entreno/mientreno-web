"use client"

import { Trash2 } from "lucide-react"
import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { useDeleteTemplate, usePlanTemplates } from "../hooks/use-plan-templates"
import type { PlanTemplate } from "../model/plan-template.model"

/**
 * The trainer's templates, with delete. Shown with any plan: a trainer who
 * went back to free still sees and can delete what they saved — only using
 * them needs Pro. Renders nothing while there are none.
 */
export function PlanTemplatesList() {
  const templates = usePlanTemplates()
  const remove = useDeleteTemplate()
  const [deleting, setDeleting] = useState<PlanTemplate | null>(null)

  if (!templates.data || templates.data.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-subtitle font-semibold tracking-tight">Mis plantillas</h2>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {templates.data.map((template) => (
          <li key={template.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{template.name}</p>
              <p className="text-caption text-muted-foreground">
                {template.dayCount} días · {template.exerciseCount} ejercicios · {formatDate(template.updatedAt)}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={`Borrar ${template.name}`} onClick={() => setDeleting(template)}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground">Para usar una, abrí el plan de un alumno y elegí &quot;Cargar plantilla&quot;.</p>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="¿Borrar la plantilla?"
        description="Los planes que ya publicaste con ella no cambian."
        confirmLabel="Borrar"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </section>
  )
}

"use client"

import { BookmarkPlus, FolderOpen, Sparkles } from "lucide-react"
import Link from "next/link"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useFeature } from "@/features/membership/hooks/use-membership"
import { FEATURES } from "@/features/membership/model/membership.model"
import type { EditorPlan } from "@/features/training-plans/model/training-plan.model"
import { useLoadTemplate, usePlanTemplates, useSaveTemplate } from "../hooks/use-plan-templates"

interface PlanTemplatesBarProps {
  plan: EditorPlan
  onLoad: (plan: EditorPlan) => void
  disabled?: boolean
}

/**
 * Save the plan being edited as a template, or start from one. Sits above the
 * editor so the editor itself does not need to know templates exist.
 *
 * Without Pro it explains the benefit and links to the plan page instead of
 * offering buttons the backend would refuse. Loading a template replaces what is
 * in the editor; the trainer still reviews and publishes it as usual, which is
 * where the plan rules are validated.
 */
export function PlanTemplatesBar({ plan, onLoad, disabled }: PlanTemplatesBarProps) {
  const { feature, isLoading } = useFeature(FEATURES.planTemplates)
  const templates = usePlanTemplates()
  const load = useLoadTemplate()
  const [saving, setSaving] = useState(false)
  const [choosing, setChoosing] = useState(false)

  if (isLoading) return null
  if (feature && !feature.enabled) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border p-3 text-body">
        <Sparkles className="size-4 text-primary-text" />
        <span className="text-muted-foreground">Guardá planes como plantilla y reutilizalos con otros alumnos.</span>
        <Link href="/dashboard/plan" className="font-medium text-primary-text underline-offset-4 hover:underline">
          Es parte de Pro
        </Link>
      </div>
    )
  }

  const list = templates.data ?? []

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" disabled={disabled || list.length === 0} onClick={() => setChoosing(true)}>
        <FolderOpen className="size-4" />
        Cargar plantilla
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setSaving(true)}>
        <BookmarkPlus className="size-4" />
        Guardar como plantilla
      </Button>

      <Dialog open={choosing} onOpenChange={setChoosing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar una plantilla</DialogTitle>
            <DialogDescription>Reemplaza lo que hay en el editor. Lo revisás y lo publicás como siempre.</DialogDescription>
          </DialogHeader>
          <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {list.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  disabled={load.isPending}
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted"
                  onClick={() =>
                    load.mutate(template.id, {
                      onSuccess: (loaded) => {
                        onLoad(loaded)
                        setChoosing(false)
                      },
                    })
                  }
                >
                  <p className="font-medium">{template.name}</p>
                  <p className="text-caption text-muted-foreground">
                    {template.dayCount} días · {template.exerciseCount} ejercicios
                    {template.description ? ` · ${template.description}` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {saving && <SaveTemplateDialog plan={plan} onClose={() => setSaving(false)} />}
    </div>
  )
}

function SaveTemplateDialog({ plan, onClose }: { plan: EditorPlan; onClose: () => void }) {
  const save = useSaveTemplate()
  const [name, setName] = useState(plan.title)
  const [description, setDescription] = useState("")

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar como plantilla</DialogTitle>
          <DialogDescription>Queda en tus plantillas para usarla con otros alumnos. No se le avisa a nadie.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="template-name">Nombre</Label>
          <Input id="template-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="template-description">Descripción (opcional)</Label>
          <Textarea id="template-description" rows={2} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <DialogFooter>
          <Button
            disabled={!name.trim() || save.isPending}
            onClick={() =>
              save.mutate(
                { name: name.trim(), description: description.trim() || null, plan },
                { onSuccess: onClose },
              )
            }
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

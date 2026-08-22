"use client"

import { History, Info, Pencil, Plus, Salad, Trash2 } from "lucide-react"
import { useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  useCurrentNutritionPlan,
  useDeleteNutritionPlanVersion,
  useEditNutritionPlan,
  useNutritionPlanHistory,
  usePublishNutritionPlan,
} from "../hooks/use-nutrition-plans"
import { toEditorNutritionPlan } from "../mappers/nutrition-plan.mapper"
import {
  emptyNutritionPlan,
  type EditorNutritionPlan,
  type NutritionPlan,
} from "../model/nutrition-plan.model"
import { NutritionPlanEditor } from "./nutrition-plan-editor"
import { NutritionPlanView } from "./nutrition-plan-view"

interface EditorSession {
  draft: EditorNutritionPlan
  planId: number | null
  version: number | null
}

interface NutritionPlanTabProps {
  subscriptionId: number
  /**
   * From the subscription's commercial plan. The backend never checks it —
   * `NutritionPlanService.create` only verifies trainer ownership — so this is
   * a warning, not a gate.
   */
  planIncludesNutrition?: boolean
}

export function NutritionPlanTab({
  subscriptionId,
  planIncludesNutrition = true,
}: NutritionPlanTabProps) {
  const current = useCurrentNutritionPlan(subscriptionId)
  const history = useNutritionPlanHistory(subscriptionId)

  const publish = usePublishNutritionPlan(subscriptionId)
  const edit = useEditNutritionPlan()
  const remove = useDeleteNutritionPlanVersion()

  const [session, setSession] = useState<EditorSession | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<NutritionPlan | null>(null)

  const versions = history.data ?? []
  const viewing = versions.find((plan) => plan.id === viewingId) ?? current.data ?? null

  if (current.isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  if (current.isError) {
    return <ErrorState error={current.error} onRetry={() => current.refetch()} />
  }

  const nutritionWarning = !planIncludesNutrition && (
    <p className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3 text-body text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <span className="text-pretty">
        El plan de suscripción de este alumno no incluye nutrición. Puedes asignarle uno igualmente,
        pero conviene revisarlo con él.
      </span>
    </p>
  )

  if (session) {
    return (
      <div className="flex flex-col gap-4">
        {nutritionWarning}
        <NutritionPlanEditor
          value={session.draft}
          onChange={(draft) => setSession({ ...session, draft })}
          editingPlanId={session.planId}
          editingVersion={session.version}
          isPending={publish.isPending || edit.isPending}
          error={publish.error ?? edit.error}
          onCancel={() => setSession(null)}
          onPublish={() =>
            publish.mutate(session.draft, {
              onSuccess: () => {
                setSession(null)
                setViewingId(null)
              },
            })
          }
          onSaveInPlace={() => {
            if (session.planId === null) return
            edit.mutate(
              { planId: session.planId, plan: session.draft },
              { onSuccess: () => setSession(null) },
            )
          }}
        />
      </div>
    )
  }

  if (!current.data) {
    return (
      <div className="flex flex-col gap-4">
        {nutritionWarning}
        <EmptyState
          icon={Salad}
          title="Este alumno aún no tiene plan nutricional"
          description="Crea el primero con sus comidas y macros. Podrás calcularlos desde el catálogo de alimentos."
          actionLabel="Crear plan"
          onAction={() =>
            setSession({ draft: emptyNutritionPlan(), planId: null, version: null })
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {nutritionWarning}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-subtitle font-semibold tracking-tight">
              {viewing?.title}
            </h3>
            {viewing && (
              <Badge variant={viewing.current ? "default" : "secondary"}>
                v{viewing.version}
                {viewing.current ? " · actual" : ""}
              </Badge>
            )}
          </div>
          {viewing && (
            <p className="mt-1 text-body text-muted-foreground">
              Creada el {formatDate(viewing.createdAt)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {viewing && (
            <Button
              variant="outline"
              onClick={() =>
                setSession({
                  draft: toEditorNutritionPlan(viewing),
                  planId: viewing.id,
                  version: viewing.version,
                })
              }
            >
              <Pencil className="size-4" />
              Editar
            </Button>
          )}
          <Button
            onClick={() =>
              setSession({
                draft: viewing ? toEditorNutritionPlan(viewing) : emptyNutritionPlan(),
                planId: null,
                version: null,
              })
            }
          >
            <Plus className="size-4" />
            Nueva versión
          </Button>
        </div>
      </div>

      {versions.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <History className="size-3.5" />
            Historial de versiones
          </p>
          <ul className="flex flex-wrap gap-2">
            {versions.map((plan) => {
              const active = viewing?.id === plan.id
              return (
                <li key={plan.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewingId(plan.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-body transition-colors",
                      "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-input",
                    )}
                  >
                    v{plan.version}
                    {plan.current && " · actual"}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Eliminar versión ${plan.version}`}
                    className="text-error-text focus-visible:text-error-text"
                    onClick={() => setPendingDelete(plan)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {viewing && !viewing.current && (
        <p className="rounded-lg border border-border bg-secondary/50 p-3 text-body text-muted-foreground">
          Estás viendo una versión antigua. La actual es la v
          {versions.find((plan) => plan.current)?.version ?? current.data.version}.
        </p>
      )}

      {viewing && <NutritionPlanView plan={viewing} />}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`¿Eliminar la versión ${pendingDelete?.version ?? ""}?`}
        description={
          pendingDelete?.current
            ? "Es la versión actual. Al eliminarla se promoverá automáticamente la anterior; si no hay ninguna, el alumno se quedará sin plan nutricional."
            : "Se eliminará del historial. La versión actual no cambia."
        }
        confirmLabel="Eliminar"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          remove.mutate(pendingDelete.id, {
            onSettled: () => {
              setPendingDelete(null)
              setViewingId(null)
            },
          })
        }}
      />
    </div>
  )
}

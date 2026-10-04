"use client"

import { Dumbbell, Pencil} from "lucide-react"
import { useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PlanVersionHistory } from "@/components/shared/plan-version-history"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import {
  useCurrentTrainingPlan,
  useDeleteTrainingPlanVersion,
  useEditTrainingPlan,
  usePublishTrainingPlan,
  useTrainingPlanHistory,
} from "../hooks/use-training-plans"
import { toEditorPlan } from "../mappers/training-plan.mapper"
import { emptyPlan, type EditorPlan, type TrainingPlan } from "../model/training-plan.model"
import { PlanTemplatesBar } from "@/features/plan-templates/components/plan-templates-bar"
import { PlanView } from "./plan-view"
import { TrainingPlanEditor } from "./training-plan-editor"

interface EditorSession {
  draft: EditorPlan
  /** null when drafting from scratch, so only "publish" is offered. */
  planId: number | null
  version: number | null
}

/**
 * Training plan for one subscription: current version, history, and editing.
 *
 * Rendered inside the student detail route so each tab loads on demand — the
 * drawer this replaces fired every query at once.
 */
export function TrainingPlanTab({ subscriptionId }: { subscriptionId: number }) {
  const current = useCurrentTrainingPlan(subscriptionId)
  const history = useTrainingPlanHistory(subscriptionId)

  const publish = usePublishTrainingPlan(subscriptionId)
  const edit = useEditTrainingPlan()
  const remove = useDeleteTrainingPlanVersion()

  const [session, setSession] = useState<EditorSession | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TrainingPlan | null>(null)

  const versions = history.data ?? []
  const viewing = versions.find((plan) => plan.id === viewingId) ?? current.data ?? null

  if (current.isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  if (current.isError) {
    return <ErrorState error={current.error} onRetry={() => current.refetch()} />
  }

  // ── Editing ───────────────────────────────────────────────────────────────
  if (session) {
    return (
      <div className="flex flex-col gap-4">
      <PlanTemplatesBar
        plan={session.draft}
        disabled={publish.isPending || edit.isPending}
        onLoad={(draft) => setSession({ ...session, draft })}
      />
      <TrainingPlanEditor
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

  // ── No plan yet ───────────────────────────────────────────────────────────
  if (!current.data) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Este alumno aún no tiene plan"
        description="Creá el primero para que aparezca en su aplicación. Al publicarlo recibirá una notificación."
        actionLabel="Crear plan"
        onAction={() => setSession({ draft: emptyPlan(), planId: null, version: null })}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
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

        {/*
          One primary action, not two.

          This header used to offer "Editar" and "Nueva versión" side by side,
          and the editor behind them offered "Guardar cambios en vN" and
          "Publicar nueva versión" — four buttons for two outcomes, with nothing
          on screen explaining the difference between a plan, a routine and a
          version. Editing already reaches both endings, so the choice belongs
          where its consequences are visible: inside the editor, next to the
          draft it applies to.
        */}
        {viewing && (
          <Button
            className="sm:shrink-0"
            onClick={() =>
              setSession({
                draft: toEditorPlan(viewing),
                planId: viewing.id,
                version: viewing.version,
              })
            }
          >
            <Pencil className="size-4" />
            Editar plan
          </Button>
        )}
      </div>

      <PlanVersionHistory
        versions={versions}
        activeId={viewing?.id ?? null}
        noun="plan"
        onSelect={setViewingId}
        onDelete={setPendingDelete}
      />

      {viewing && !viewing.current && (
        <p className="rounded-lg border border-border bg-secondary/50 p-3 text-body text-muted-foreground">
          Estás viendo una versión antigua. La actual es la v
          {versions.find((plan) => plan.current)?.version ?? current.data.version}.
        </p>
      )}

      {viewing && <PlanView plan={viewing} />}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`¿Eliminar la versión ${pendingDelete?.version ?? ""}?`}
        description={
          pendingDelete?.current
            ? "Es la versión actual. Al eliminarla se promoverá automáticamente la anterior; si no hay ninguna, el alumno se quedará sin plan."
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

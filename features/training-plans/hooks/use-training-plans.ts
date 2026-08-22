"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { specificMessage } from "@/core/http/user-message"
import { trainingPlansRepository } from "../api/training-plans.repository"
import type { EditorPlan } from "../model/training-plan.model"

export function useCurrentTrainingPlan(subscriptionId: number | null) {
  return useQuery({
    queryKey: qk.trainingPlans.current(subscriptionId ?? 0),
    queryFn: () => trainingPlansRepository.getCurrent(subscriptionId as number),
    enabled: subscriptionId !== null,
    staleTime: 60_000,
  })
}

export function useTrainingPlanHistory(subscriptionId: number | null) {
  return useQuery({
    queryKey: qk.trainingPlans.history(subscriptionId ?? 0),
    queryFn: () => trainingPlansRepository.getHistory(subscriptionId as number),
    enabled: subscriptionId !== null,
    staleTime: 60_000,
  })
}

export function useTrainerStudentPlans() {
  return useQuery({
    queryKey: qk.trainingPlans.consolidated,
    queryFn: () => trainingPlansRepository.getStudentPlans(),
    staleTime: 60_000,
  })
}

/**
 * Every mutation in this file reports through here, so the wording of a
 * failure is decided in one place — `core/http/user-message.ts` — instead of
 * forwarding whatever the backend happened to say. `fallback` names the action
 * that failed, and is used only when the error carries nothing displayable.
 */
function errorMessage(error: unknown, fallback: string): string {
  return specificMessage(error) ?? fallback
}

/**
 * Publishes a new version (POST).
 *
 * Invalidates the whole `training-plans` namespace: a new version changes the
 * current plan, the history and the consolidated trainer view at once.
 */
export function usePublishTrainingPlan(subscriptionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (plan: EditorPlan) =>
      trainingPlansRepository.publishVersion(subscriptionId, plan),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: qk.trainingPlans.all })
      toast.success(`Versión ${plan.version} publicada. El alumno ha sido notificado.`)
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido publicar el plan")),
  })
}

/** Edits a version in place (PUT). No new version, no notification. */
export function useEditTrainingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, plan }: { planId: number; plan: EditorPlan }) =>
      trainingPlansRepository.editInPlace(planId, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trainingPlans.all })
      toast.success("Cambios guardados")
    },
    onError: (error) => toast.error(errorMessage(error, "No se han podido guardar los cambios")),
  })
}

export function useDeleteTrainingPlanVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    // 204 — one of the endpoints that used to 500 before the phase 0 proxy fix.
    mutationFn: (planId: number) => trainingPlansRepository.deleteVersion(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trainingPlans.all })
      toast.success("Versión eliminada")
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido eliminar la versión")),
  })
}

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { specificMessage } from "@/core/http/user-message"
import { subscriptionPlansRepository } from "../api/subscription-plans.repository"
import type { PlanFormValues } from "../model/subscription-plan.model"

export function useMyPlans() {
  return useQuery({
    queryKey: qk.subscriptionPlans.mine,
    queryFn: () => subscriptionPlansRepository.listMine(),
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

export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: PlanFormValues) => subscriptionPlansRepository.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.subscriptionPlans.all })
      toast.success("Plan creado")
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido crear el plan")),
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, values }: { planId: number; values: PlanFormValues }) =>
      subscriptionPlansRepository.update(planId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.subscriptionPlans.all })
      toast.success("Plan actualizado")
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido actualizar el plan")),
  })
}

export function useDeactivatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    // Answers 204 — which used to become a 500 before the phase 0 proxy fix.
    mutationFn: (planId: number) => subscriptionPlansRepository.deactivate(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.subscriptionPlans.all })
      toast.success("Plan desactivado. Los alumnos suscritos no se ven afectados.")
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido desactivar el plan")),
  })
}

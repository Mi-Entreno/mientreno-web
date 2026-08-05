"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/core/http/errors"
import { qk } from "@/core/http/query-keys"
import { nutritionPlansRepository } from "../api/nutrition-plans.repository"
import type { EditorNutritionPlan } from "../model/nutrition-plan.model"

export function useCurrentNutritionPlan(subscriptionId: number | null) {
  return useQuery({
    queryKey: qk.nutritionPlans.current(subscriptionId ?? 0),
    queryFn: () => nutritionPlansRepository.getCurrent(subscriptionId as number),
    enabled: subscriptionId !== null,
    staleTime: 60_000,
  })
}

export function useNutritionPlanHistory(subscriptionId: number | null) {
  return useQuery({
    queryKey: qk.nutritionPlans.history(subscriptionId ?? 0),
    queryFn: () => nutritionPlansRepository.getHistory(subscriptionId as number),
    enabled: subscriptionId !== null,
    staleTime: 60_000,
  })
}

export function useTrainerStudentNutrition() {
  return useQuery({
    queryKey: qk.nutritionPlans.consolidated,
    queryFn: () => nutritionPlansRepository.getStudentPlans(),
    staleTime: 60_000,
  })
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function usePublishNutritionPlan(subscriptionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (plan: EditorNutritionPlan) =>
      nutritionPlansRepository.publishVersion(subscriptionId, plan),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: qk.nutritionPlans.all })
      // Deliberately no "el alumno ha sido notificado": unlike training plans,
      // NutritionPlanService.create sends no notification.
      toast.success(`Versión ${plan.version} publicada`)
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido publicar el plan")),
  })
}

export function useEditNutritionPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, plan }: { planId: number; plan: EditorNutritionPlan }) =>
      nutritionPlansRepository.editInPlace(planId, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.nutritionPlans.all })
      toast.success("Cambios guardados")
    },
    onError: (error) => toast.error(errorMessage(error, "No se han podido guardar los cambios")),
  })
}

export function useDeleteNutritionPlanVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: number) => nutritionPlansRepository.deleteVersion(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.nutritionPlans.all })
      toast.success("Versión eliminada")
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido eliminar la versión")),
  })
}

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { isPremiumRequired, specificMessage } from "@/core/http/user-message"
import type { EditorPlan } from "@/features/training-plans/model/training-plan.model"
import { planTemplatesRepository } from "../api/plan-templates.repository"

export function usePlanTemplates() {
  return useQuery({
    queryKey: qk.planTemplates.list,
    queryFn: ({ signal }) => planTemplatesRepository.list(signal),
  })
}

export function useSaveTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; description: string | null; plan: EditorPlan }) =>
      planTemplatesRepository.save(input),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: qk.planTemplates.all })
      toast.success(`Plantilla "${template.name}" guardada`)
    },
    // The 402 is announced by providers.tsx with a "Ver planes" action.
    onError: (error) => {
      if (isPremiumRequired(error)) return
      toast.error(specificMessage(error) ?? "No pudimos guardar la plantilla")
    },
  })
}

export function useLoadTemplate() {
  return useMutation({
    mutationFn: (templateId: number) => planTemplatesRepository.load(templateId),
    onError: (error) => {
      if (isPremiumRequired(error)) return
      toast.error(specificMessage(error) ?? (error instanceof Error ? error.message : "No pudimos cargar la plantilla"))
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (templateId: number) => planTemplatesRepository.remove(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.planTemplates.all })
      toast.success("Plantilla borrada")
    },
    onError: (error) => toast.error(specificMessage(error) ?? "No pudimos borrar la plantilla"),
  })
}

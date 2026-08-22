"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { specificMessage } from "@/core/http/user-message"
import { qk } from "@/core/http/query-keys"
import { trainerProfileRepository } from "../api/trainer-profile.repository"
import type {
  CompleteProfileIdentityValues,
  TrainerProfileFormValues,
} from "../model/trainer-profile.model"

/** `data` is `null` when the trainer has not completed the profile yet. */
export function useTrainerProfile() {
  return useQuery({
    queryKey: qk.trainerProfile,
    queryFn: () => trainerProfileRepository.get(),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateTrainerProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: TrainerProfileFormValues) => trainerProfileRepository.update(values),
    onSuccess: (profile) => {
      queryClient.setQueryData(qk.trainerProfile, profile)
      toast.success("Perfil actualizado")
    },
    onError: (error) => {
      toast.error(specificMessage(error) ?? "No pudimos guardar tu perfil. Volvé a intentarlo.")
    },
  })
}

/**
 * Completes the profile for the first time.
 *
 * On success the session cookie has already been replaced server-side with a
 * token whose `profileCompleted` claim is true, so `router.refresh()` is what
 * lets the route guard stop redirecting to onboarding.
 */
export function useCompleteTrainerProfile() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: ({
      values,
      identity,
    }: {
      values: TrainerProfileFormValues
      identity: CompleteProfileIdentityValues
    }) => trainerProfileRepository.complete(values, identity),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.trainerProfile })
      await queryClient.invalidateQueries({ queryKey: qk.session })
      toast.success("Perfil completado. ¡Bienvenido!")
      router.replace("/dashboard")
      router.refresh()
    },
    onError: (error) => {
      toast.error(
        specificMessage(error) ?? "No pudimos crear tu perfil. Volvé a intentarlo.",
      )
    },
  })
}

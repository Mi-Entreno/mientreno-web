"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { specificMessage } from "@/core/http/user-message"
import { qk } from "@/core/http/query-keys"
import { userRepository } from "../api/user.repository"
import type { UserProfileFormValues } from "../mappers/user.mapper"
import type { UserPreferences } from "../model/user.model"

export function useUserProfile() {
  return useQuery({
    queryKey: qk.userDetail,
    queryFn: () => userRepository.getProfile(),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: UserProfileFormValues) => userRepository.updateProfile(values),
    onSuccess: (profile) => {
      queryClient.setQueryData(qk.userDetail, profile)
      // The trainer profile embeds the same name and avatar.
      queryClient.invalidateQueries({ queryKey: qk.trainerProfile })
      toast.success("Datos personales actualizados")
    },
    onError: (error) => {
      toast.error(specificMessage(error) ?? "No pudimos guardar los cambios. Volvé a intentarlo.")
    },
  })
}

export function useUserPreferences() {
  return useQuery({
    queryKey: qk.preferences,
    queryFn: () => userRepository.getPreferences(),
    staleTime: 5 * 60_000,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (preferences: UserPreferences) => userRepository.updatePreferences(preferences),
    onSuccess: (preferences) => {
      queryClient.setQueryData(qk.preferences, preferences)
      toast.success("Preferencias guardadas")
    },
    onError: (error) => {
      toast.error(specificMessage(error) ?? "No pudimos guardar tus preferencias. Volvé a intentarlo.")
    },
  })
}

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { userMessage, type FailureContext } from "@/core/http/user-message"

import { brandRepository } from "../api/brand.repository"

export function useBrandProfile() {
  return useQuery({
    queryKey: qk.brand.profile,
    queryFn: () => brandRepository.profile(),
  })
}

/**
 * El perfil es lo único que queda en este slice, y aun así la invalidación va al
 * namespace entero: la dirección de retiro y el logo aparecen dentro de cada
 * desafío que el alumno mira, así que cambiarlos toca más de una pantalla.
 */
function useBrandMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  successMessage: () => string,
  context: FailureContext,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.brand.all })
      queryClient.invalidateQueries({ queryKey: qk.challenges.all })
      toast.success(successMessage())
    },
    onError: (error) => toast.error(userMessage(error, context)),
  })
}

export function useUpdateBrandProfile() {
  return useBrandMutation(
    (input: Parameters<typeof brandRepository.updateProfile>[0]) => brandRepository.updateProfile(input),
    () => "Perfil actualizado.",
    "save",
  )
}

export function useUploadBrandLogo() {
  return useBrandMutation(
    (file: File) => brandRepository.uploadLogo(file),
    () => "Logo actualizado.",
    "upload",
  )
}

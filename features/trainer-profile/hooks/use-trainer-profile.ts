"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { specificMessage } from "@/core/http/user-message"
import { qk } from "@/core/http/query-keys"
import { userRepository } from "@/features/user/api/user.repository"
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
    mutationFn: async (values: TrainerProfileFormValues) => {
      const profile = await trainerProfileRepository.update(values)
      await mirrorAvatarToAccount(values.avatarPath)
      return profile
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(qk.trainerProfile, profile)
      queryClient.invalidateQueries({ queryKey: qk.userDetail })
      toast.success("Perfil actualizado")
    },
    onError: (error) => {
      toast.error(specificMessage(error) ?? "No pudimos guardar tu perfil. Volvé a intentarlo.")
    },
  })
}

/**
 * Keeps the account's photo in step with the professional one.
 *
 * The backend stores a trainer's photo twice — `Trainer.profileImageUrl` and
 * `UserDetail.pathProfilePicture` — behind two different endpoints, and the
 * dashboard used to offer a separate uploader for each. Two photos of the same
 * person that silently drift apart is not a feature, so there is now one field,
 * on the professional profile, and this write carries it across.
 *
 * Deliberately best-effort: `profileImageUrl` is the one every surface reads
 * (sidebar, header, directory, invitation link), and it has already been saved
 * by the time this runs. Failing the whole mutation over the secondary copy
 * would tell the trainer nothing was saved when in fact the part that matters
 * was.
 */
async function mirrorAvatarToAccount(avatarPath: string): Promise<void> {
  try {
    const account = await userRepository.getProfile()
    if ((account.avatarPath ?? "") === avatarPath) return

    await userRepository.updateProfile({
      firstName: account.firstName,
      lastName: account.lastName,
      birthDate: account.birthDate,
      gender: account.gender,
      country: account.country,
      avatarPath,
    })
  } catch {
    // Nothing to tell the user: the canonical field saved.
  }
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

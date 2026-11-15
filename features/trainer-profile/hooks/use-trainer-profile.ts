"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { specificMessage } from "@/core/http/user-message"
import { qk } from "@/core/http/query-keys"
import { uploadAvatar } from "@/core/media/upload-avatar"
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
 * The photo is uploaded *after* completing, not when picked: the upload endpoint
 * writes to `UserDetail`, a row `POST /complete` itself creates, so before it a
 * new trainer's upload answered 404 (shown as "todavía no está disponible").
 * The upload also writes `Trainer.profileImageUrl`, so no follow-up `PUT` is
 * needed. Best-effort: the profile already exists, and failing the mutation
 * would invite a second completion that answers 409 — so a failed photo lands
 * the trainer on their profile with `?foto=error` to retry it there (a toast
 * would not survive the navigation below).
 *
 * Then a hard navigation, not `router.replace("/dashboard")`. The sidebar
 * prefetches its links while the profile is still incomplete, and what the
 * router caches from those prefetches is the guard's redirect back to
 * `/dashboard/profile?complete=1`. A soft navigation reused it — the trainer
 * stayed on this screen and every drawer link bounced back here until a
 * reload. A new document request drops the router cache and re-runs the guard
 * against the cookie just written. Same fix as the brand onboarding.
 */
export function useCompleteTrainerProfile() {
  return useMutation({
    mutationFn: async ({
      values,
      identity,
      avatarFile,
    }: {
      values: TrainerProfileFormValues
      identity: CompleteProfileIdentityValues
      avatarFile: File | null
    }) => {
      await trainerProfileRepository.complete(values, identity)
      if (!avatarFile) return { photoFailed: false }
      try {
        await uploadAvatar(avatarFile)
        return { photoFailed: false }
      } catch {
        return { photoFailed: true }
      }
    },
    onSuccess: ({ photoFailed }) => {
      // Never resolves: `isPending` stays true until the page unloads, keeping
      // the submit button disabled — re-enabling it would only invite a 409.
      window.location.assign(photoFailed ? "/dashboard/profile?foto=error" : "/dashboard")
      return new Promise<never>(() => {})
    },
    onError: (error) => {
      toast.error(
        specificMessage(error) ?? "No pudimos crear tu perfil. Volvé a intentarlo.",
      )
    },
  })
}

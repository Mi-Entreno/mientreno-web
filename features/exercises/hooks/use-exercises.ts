"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { specificMessage } from "@/core/http/user-message"
import { exercisesRepository } from "../api/exercises.repository"

export function useExerciseDetail(exerciseId: number | null) {
  return useQuery({
    queryKey: qk.exercises.detail(exerciseId ?? 0),
    queryFn: () => exercisesRepository.getById(exerciseId as number),
    enabled: exerciseId !== null,
    staleTime: 60_000,
  })
}

export function useExerciseVideos(exerciseId: number | null) {
  return useQuery({
    queryKey: qk.exercises.videos(exerciseId ?? 0),
    queryFn: () => exercisesRepository.listVideos(exerciseId as number),
    enabled: exerciseId !== null,
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
 * Uploads a video and tracks progress.
 *
 * Progress lives in local state rather than in the mutation, since React Query
 * has no concept of partial progress for a mutation in flight.
 */
export function useUploadExerciseVideo(exerciseId: number) {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)

  const mutation = useMutation({
    mutationFn: (file: File) =>
      exercisesRepository.uploadVideo(exerciseId, file, setProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.exercises.videos(exerciseId) })
      queryClient.invalidateQueries({ queryKey: qk.exercises.detail(exerciseId) })
      // Uploading sets `exercise.mediaUrl`, which the plan response carries.
      queryClient.invalidateQueries({ queryKey: qk.trainingPlans.all })
      toast.success("Vídeo subido")
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido subir el vídeo")),
    onSettled: () => setProgress(0),
  })

  return { ...mutation, progress }
}

export function useDeleteExerciseVideo(exerciseId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (videoId: number) => exercisesRepository.deleteVideo(exerciseId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.exercises.videos(exerciseId) })
      queryClient.invalidateQueries({ queryKey: qk.exercises.detail(exerciseId) })
      // Deleting clears `mediaUrl` when it pointed at this video.
      queryClient.invalidateQueries({ queryKey: qk.trainingPlans.all })
      toast.success("Vídeo eliminado")
    },
    onError: (error) => toast.error(errorMessage(error, "No se ha podido eliminar el vídeo")),
  })
}

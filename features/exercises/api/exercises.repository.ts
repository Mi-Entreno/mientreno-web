import { apiFetch } from "@/core/http/client"
import { ApiError, normalizeError } from "@/core/http/errors"

import type { ExerciseDetailResponseDTO, ExerciseVideoResponseDTO } from "../dto/exercise.dto"
import { toExerciseDetail, toExerciseVideo } from "../mappers/exercise.mapper"
import type { ExerciseDetail, ExerciseVideo } from "../model/exercise.model"

export const exercisesRepository = {
  async getById(exerciseId: number): Promise<ExerciseDetail> {
    return toExerciseDetail(
      await apiFetch<ExerciseDetailResponseDTO>(`/api/exercises/${exerciseId}`),
    )
  },

  /** Newest first — `findByExerciseIdOrderByCreatedAtDesc`. */
  async listVideos(exerciseId: number): Promise<ExerciseVideo[]> {
    const dtos = await apiFetch<ExerciseVideoResponseDTO[]>(
      `/api/exercises/${exerciseId}/videos`,
    )
    return dtos.map(toExerciseVideo)
  },

  /**
   * Uploads a video, reporting progress.
   *
   * `XMLHttpRequest` rather than `fetch`: fetch cannot report **upload**
   * progress (request streams are still not usable for it in practice), and a
   * 100 MB transfer with no feedback is indistinguishable from a hang.
   *
   * The request is multipart with a single `file` part, matching
   * `@RequestParam("file") MultipartFile`. The browser sets the boundary, so no
   * `Content-Type` header is set here — and the phase 0 proxy forwards it
   * untouched instead of forcing JSON.
   */
  uploadVideo(
    exerciseId: number,
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<ExerciseVideo> {
    return new Promise((resolve, reject) => {
      const body = new FormData()
      body.append("file", file)

      const request = new XMLHttpRequest()
      request.open("POST", `/api/backend/api/exercises/${exerciseId}/videos`)
      request.withCredentials = true

      request.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress?.(Math.round((event.loaded / event.total) * 100))
        }
      })

      request.addEventListener("load", () => {
        let parsed: unknown
        try {
          parsed = request.responseText ? JSON.parse(request.responseText) : undefined
        } catch {
          parsed = { message: request.responseText }
        }

        if (request.status >= 200 && request.status < 300) {
          resolve(toExerciseVideo(parsed as ExerciseVideoResponseDTO))
          return
        }

        reject(new ApiError(normalizeError(request.status, parsed)))
      })

      request.addEventListener("error", () =>
        reject(new ApiError({ kind: "network", message: "No se ha podido subir el vídeo" })),
      )

      request.addEventListener("abort", () =>
        reject(new ApiError({ kind: "network", message: "Subida cancelada" })),
      )

      signal?.addEventListener("abort", () => request.abort())

      request.send(body)
    })
  },

  /** 204 on success. */
  async deleteVideo(exerciseId: number, videoId: number): Promise<void> {
    await apiFetch<void>(`/api/exercises/${exerciseId}/videos/${videoId}`, { method: "DELETE" })
  },
}

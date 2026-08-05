import {
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
  VIDEO_EXTENSIONS,
} from "../dto/exercise.dto"

export interface ExerciseDetail {
  id: number
  trainingPlanId: number
  planTitle: string
  trainingDayId: number
  dayNumber: number
  dayLabel: string
  order: number
  name: string
  sets: number | null
  reps: number | null
  weightValue: number | null
  weightUnit: string | null
  restSeconds: number | null
  durationSeconds: number | null
  /** Display URL through the media proxy. */
  mediaUrl: string | null
  trainerNotes: string
  catalogExerciseId: number | null
  muscleGroup: string | null
  secondaryMuscles: string[]
  equipment: string | null
  instructions: string | null
}

export interface ExerciseVideo {
  id: number
  exerciseId: number
  fileName: string
  contentType: string | null
  sizeBytes: number
  /** Display URL through the media proxy. */
  url: string | null
  createdAt: string
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type VideoRejection =
  | { reason: "empty" }
  | { reason: "type"; actual: string }
  | { reason: "size"; bytes: number }

/**
 * Client-side gate mirroring `validateVideoFile` plus Spring's size limit.
 *
 * Both are worth checking here rather than letting the server answer: an
 * oversized upload would transfer up to 100 MB only to come back as an opaque
 * 500, and a wrong MIME type would waste the whole transfer for a 400.
 */
export function rejectVideo(file: File): VideoRejection | null {
  if (file.size === 0) return { reason: "empty" }
  if (file.size > MAX_VIDEO_BYTES) return { reason: "size", bytes: file.size }

  if (!ALLOWED_VIDEO_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_TYPES)[number])) {
    return { reason: "type", actual: file.type || "desconocido" }
  }

  return null
}

export function rejectionMessage(rejection: VideoRejection): string {
  switch (rejection.reason) {
    case "empty":
      return "El archivo está vacío."
    case "size":
      return `El vídeo pesa ${formatBytes(rejection.bytes)} y el máximo son 100 MB.`
    case "type":
      return `Formato no admitido (${rejection.actual}). Se aceptan ${VIDEO_EXTENSIONS.join(", ")}.`
  }
}

export { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES, VIDEO_EXTENSIONS }

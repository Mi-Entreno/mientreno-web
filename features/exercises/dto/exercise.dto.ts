/** Literal mirrors of `plan/dto/response` for a plan exercise and its videos. */

/**
 * `ExerciseDetailResponseDTO` — richer than the row inside a plan: it adds the
 * plan/day context and the catalogue's instructions and secondary muscles.
 */
export interface ExerciseDetailResponseDTO {
  id: number
  trainingPlanId: number
  planTitle: string | null
  trainingDayId: number
  dayNumber: number
  dayLabel: string | null
  exerciseOrder: number
  name: string
  sets: number | null
  reps: number | null
  weightValue: number | null
  weightUnit: string | null
  restSeconds: number | null
  durationSeconds: number | null
  mediaUrl: string | null
  trainerNotes: string | null
  catalogExerciseId: number | null
  muscleGroup: string | null
  secondaryMuscles: string[]
  equipment: string | null
  instructions: string | null
}

/** `ExerciseVideoResponseDTO`. `createdAt` is a `LocalDateTime`. */
export interface ExerciseVideoResponseDTO {
  id: number
  exerciseId: number
  originalFileName: string
  contentType: string | null
  fileSizeBytes: number
  url: string
  uploadedByTrainerId: number
  createdAt: string
}

/**
 * The exact MIME types `ExerciseVideoService.ALLOWED_TYPES` accepts.
 *
 * The check is on `file.getContentType()`, i.e. whatever the browser put in the
 * multipart part — which comes from the OS, not the extension. A file the OS
 * types as something else is rejected with 400 however it is named.
 */
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/mpeg",
] as const

export const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mpeg", ".mpg"] as const

/**
 * `spring.servlet.multipart.max-file-size=100MB`.
 *
 * Exceeding it raises `MaxUploadSizeExceededException`, which
 * `GlobalExceptionHandler` only catches with its `Exception` fallback — so the
 * client gets a generic **500**, not a 413. Checking the size before uploading
 * is the only way to give an accurate message (and it saves the transfer).
 */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024

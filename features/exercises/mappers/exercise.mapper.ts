import { toMediaUrl } from "@/core/http/media"

import type { ExerciseDetailResponseDTO, ExerciseVideoResponseDTO } from "../dto/exercise.dto"
import type { ExerciseDetail, ExerciseVideo } from "../model/exercise.model"

export function toExerciseDetail(dto: ExerciseDetailResponseDTO): ExerciseDetail {
  return {
    id: dto.id,
    trainingPlanId: dto.trainingPlanId,
    planTitle: dto.planTitle ?? "",
    trainingDayId: dto.trainingDayId,
    dayNumber: dto.dayNumber,
    dayLabel: dto.dayLabel ?? "",
    order: dto.exerciseOrder,
    name: dto.name,
    sets: dto.sets,
    reps: dto.reps,
    weightValue: dto.weightValue,
    weightUnit: dto.weightUnit,
    restSeconds: dto.restSeconds,
    durationSeconds: dto.durationSeconds,
    // Stored files sit behind /api/files/**, which needs a bearer token.
    mediaUrl: toMediaUrl(dto.mediaUrl),
    trainerNotes: dto.trainerNotes ?? "",
    catalogExerciseId: dto.catalogExerciseId,
    muscleGroup: dto.muscleGroup,
    secondaryMuscles: [
      ...new Set((dto.secondaryMuscles ?? []).map((item) => item.trim()).filter(Boolean)),
    ],
    equipment: dto.equipment,
    instructions: dto.instructions?.trim() || null,
  }
}

export function toExerciseVideo(dto: ExerciseVideoResponseDTO): ExerciseVideo {
  return {
    id: dto.id,
    exerciseId: dto.exerciseId,
    fileName: dto.originalFileName,
    contentType: dto.contentType,
    sizeBytes: dto.fileSizeBytes,
    url: toMediaUrl(dto.url),
    createdAt: dto.createdAt,
  }
}

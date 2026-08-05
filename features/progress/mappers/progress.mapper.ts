import { toMediaUrl } from "@/core/http/media"

import type { ProgressResponseDTO } from "../dto/progress.dto"
import type { ProgressEntry } from "../model/progress.model"

export function toProgressEntry(dto: ProgressResponseDTO): ProgressEntry {
  return {
    id: dto.id,
    subscriptionId: dto.subscriptionId,
    weightKg: dto.weightKg,
    bodyFatPct: dto.bodyFatPct,
    chestCm: dto.chestCm,
    waistCm: dto.waistCm,
    hipsCm: dto.hipsCm,
    armsCm: dto.armsCm,
    thighsCm: dto.thighsCm,
    // Progress photos are stored files behind /api/files/**.
    photoUrl: toMediaUrl(dto.photoUrl),
    notes: dto.notes ?? "",
    recordedAt: dto.recordedAt,
    createdAt: dto.createdAt,
  }
}

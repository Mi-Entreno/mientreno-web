import { toMediaUrl } from "@/core/http/media"

import type {
  BrandChallengeDTO,
  ChallengeParticipantDTO,
  RedemptionDTO,
  RewardDTO,
} from "../dto/challenge.dto"
import type { BrandChallenge, ChallengeParticipant, Redemption, Reward } from "../model/challenge.model"

/**
 * DTO → model.
 *
 * Every URL-bearing field goes through `toMediaUrl`: with the backend's default
 * local storage those files sit behind `/api/files/**`, which is authenticated,
 * and an `<img src>` sends no `Authorization` header.
 */

function toReward(dto: RewardDTO): Reward {
  return {
    name: dto.name,
    description: dto.description,
    imageUrl: toMediaUrl(dto.imageUrl),
    terms: dto.terms,
    expiresAt: dto.expiresAt,
    stock: dto.stock,
  }
}

export function toBrandChallenge(dto: BrandChallengeDTO): BrandChallenge {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    imageUrl: toMediaUrl(dto.imageUrl),
    terms: dto.terms,
    status: dto.status,
    requirementMode: dto.requirementMode,
    requiredCount: dto.requiredCount,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    reward: toReward(dto.reward),
    requirements: dto.requirements.map((requirement) => ({
      id: requirement.id,
      metric: requirement.metric,
      label: requirement.label,
      unit: requirement.unit,
      metricFamily: requirement.metricFamily,
      targetValue: requirement.targetValue,
      goalKey: requirement.goalKey,
    })),
    goalSignature: dto.goalSignature,
    acceptedCount: dto.acceptedCount,
    completedCount: dto.completedCount,
    redeemedCount: dto.redeemedCount,
    stockLeft: dto.stockLeft,
    editable: dto.editable,
  }
}

export function toParticipant(dto: ChallengeParticipantDTO): ChallengeParticipant {
  return {
    id: dto.id,
    // El backend manda sólo el nombre de pila: alcanza para reconocer a quien
    // viene a retirar y no expone la ficha del alumno.
    studentFirstName: dto.studentFirstName,
    status: dto.status,
    acceptedAt: dto.acceptedAt,
    completedAt: dto.completedAt,
    redeemedAt: dto.redeemedAt,
    deliveredAt: dto.deliveredAt,
    redemptionCode: dto.redemptionCode,
  }
}

export function toRedemption(dto: RedemptionDTO): Redemption {
  return {
    id: dto.id,
    challengeId: dto.challengeId,
    challengeName: dto.name,
    rewardName: dto.reward.name,
    rewardImageUrl: toMediaUrl(dto.reward.imageUrl),
    status: dto.status,
    redeemedAt: dto.redeemedAt,
    deliveredAt: dto.deliveredAt,
    redemptionCode: dto.redemptionCode,
    rewardExpiresAt: dto.reward.expiresAt,
  }
}

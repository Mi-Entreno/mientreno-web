import type { PlanTemplateDTO } from "../dto/plan-template.dto"
import type { PlanTemplate } from "../model/plan-template.model"

export function toPlanTemplate(dto: PlanTemplateDTO): PlanTemplate {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    dayCount: dto.dayCount,
    exerciseCount: dto.exerciseCount,
    updatedAt: dto.updatedAt,
  }
}

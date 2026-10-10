import { apiFetch } from "@/core/http/client"
import type { EditorPlan } from "@/features/training-plans/model/training-plan.model"

import type { PlanTemplateDTO, PlanTemplateRequestDTO } from "../dto/plan-template.dto"
import { toPlanTemplate } from "../mappers/plan-template.mapper"
import {
  fromTemplateContent,
  TEMPLATE_SCHEMA_VERSION,
  templateCounts,
  toTemplateContent,
  type PlanTemplate,
} from "../model/plan-template.model"

const BASE = "/api/trainer/plan-templates"

/**
 * The trainer's saved plans. Listing and deleting work on any plan; saving and
 * loading one into the editor need Pro (402 otherwise).
 */
export const planTemplatesRepository = {
  async list(signal?: AbortSignal): Promise<PlanTemplate[]> {
    return (await apiFetch<PlanTemplateDTO[]>(BASE, { signal })).map(toPlanTemplate)
  },

  /** The template as editor state, ready to load. Throws if the stored content is not a plan. */
  async load(templateId: number): Promise<EditorPlan> {
    const dto = await apiFetch<PlanTemplateDTO>(`${BASE}/${templateId}`)
    const plan = fromTemplateContent(dto.content)
    if (!plan) throw new Error("La plantilla está dañada y no se puede cargar")
    return plan
  },

  async save(input: { name: string; description: string | null; plan: EditorPlan }): Promise<PlanTemplate> {
    const body: PlanTemplateRequestDTO = {
      name: input.name,
      description: input.description,
      content: toTemplateContent(input.plan),
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      ...templateCounts(input.plan),
    }
    return toPlanTemplate(await apiFetch<PlanTemplateDTO>(BASE, { method: "POST", body }))
  },

  async remove(templateId: number): Promise<void> {
    await apiFetch<void>(`${BASE}/${templateId}`, { method: "DELETE" })
  },
}

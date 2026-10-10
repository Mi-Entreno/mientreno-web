/**
 * `PlanTemplateResponseDTO` / `PlanTemplateRequestDTO` (TrainerPlanTemplateController).
 *
 * `content` is opaque to the backend: it is this panel's editor state (see
 * `model/plan-template.model.ts`), stored and returned verbatim.
 */
export interface PlanTemplateDTO {
  id: number
  name: string
  description: string | null
  dayCount: number
  exerciseCount: number
  schemaVersion: number
  /** null in the list; present when fetching one template. */
  content: unknown | null
  updatedAt: string
}

export interface PlanTemplateRequestDTO {
  name: string
  description: string | null
  content: unknown
  dayCount: number
  exerciseCount: number
  schemaVersion: number
}

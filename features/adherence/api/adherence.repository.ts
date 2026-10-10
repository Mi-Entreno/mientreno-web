import { apiFetch } from "@/core/http/client"

import type { AdherenceDTO } from "../dto/adherence.dto"
import { toAdherence } from "../mappers/adherence.mapper"
import type { Adherence } from "../model/adherence.model"

export const adherenceRepository = {
  /** 402 without Pro: callers only ask once the plan is known to include it. */
  async get(signal?: AbortSignal): Promise<Adherence> {
    return toAdherence(await apiFetch<AdherenceDTO>("/api/trainer/adherence", { signal }))
  },
}

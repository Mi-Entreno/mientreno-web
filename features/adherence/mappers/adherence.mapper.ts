import type { AdherenceDTO } from "../dto/adherence.dto"
import type { Adherence } from "../model/adherence.model"

/** Identity today; kept so a reshaped field changes here only. */
export const toAdherence = (dto: AdherenceDTO): Adherence => dto

import { apiFetch } from "@/core/http/client"
import { mapPage, pageQuery, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type {
  AdminWalletStudentDTO,
  EconomyConfigDTO,
  EconomyMetricsDTO,
  EconomyVersionDTO,
  LedgerEntryDTO,
  SaveEconomyRequestDTO,
  WalletAdjustmentRequestDTO,
  WalletDTO,
} from "../dto/economy-admin.dto"
import { toAdminWalletStudent, toLedgerEntry } from "../mappers/economy-admin.mapper"
import type { AdminWalletStudent, EconomyConfig, LedgerEntry } from "../model/economy-admin.model"

/**
 * The reps economy, for the admin. Every save is a new version upstream
 * (`economy_config_versions`) with author and note, applied on the spot; the
 * previous one can always be restored.
 */
export const economyAdminRepository = {
  current(signal?: AbortSignal): Promise<EconomyConfig> {
    return apiFetch<EconomyConfigDTO>("/api/admin/economy", { signal })
  },

  save(body: SaveEconomyRequestDTO): Promise<EconomyConfig> {
    return apiFetch<EconomyConfigDTO>("/api/admin/economy", { method: "PUT", body })
  },

  history(signal?: AbortSignal): Promise<EconomyVersionDTO[]> {
    return apiFetch<EconomyVersionDTO[]>("/api/admin/economy/history", { signal })
  },

  version(versionId: number, signal?: AbortSignal): Promise<EconomyConfig> {
    return apiFetch<EconomyConfigDTO>(`/api/admin/economy/history/${versionId}`, { signal })
  },

  restore(versionId: number): Promise<EconomyConfig> {
    return apiFetch<EconomyConfigDTO>(`/api/admin/economy/history/${versionId}/restore`, { method: "POST" })
  },

  metrics(months: number, signal?: AbortSignal): Promise<EconomyMetricsDTO> {
    return apiFetch<EconomyMetricsDTO>("/api/admin/economy/metrics", { query: { months }, signal })
  },

  async searchWallets(search: string, signal?: AbortSignal): Promise<AdminWalletStudent[]> {
    return (await apiFetch<AdminWalletStudentDTO[]>("/api/admin/wallets", { query: { search }, signal })).map(
      toAdminWalletStudent,
    )
  },

  async walletHistory(studentId: number, page: number, signal?: AbortSignal): Promise<PageResponse<LedgerEntry>> {
    const dto = await apiFetch<SpringPage<LedgerEntryDTO>>(`/api/admin/wallets/${studentId}/history`, {
      query: pageQuery({ page }),
      signal,
    })
    return mapPage(dto, toLedgerEntry)
  },

  adjust(studentId: number, body: WalletAdjustmentRequestDTO): Promise<WalletDTO> {
    return apiFetch<WalletDTO>(`/api/admin/wallets/${studentId}/adjust`, { method: "POST", body })
  },
}

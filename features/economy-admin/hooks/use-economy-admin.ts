"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { specificMessage } from "@/core/http/user-message"
import { economyAdminRepository } from "../api/economy-admin.repository"
import type { EconomyConfig } from "../model/economy-admin.model"

export function useEconomy() {
  return useQuery({
    queryKey: qk.admin.economy,
    queryFn: ({ signal }) => economyAdminRepository.current(signal),
  })
}

export function useEconomyHistory() {
  return useQuery({
    queryKey: qk.admin.economyHistory,
    queryFn: ({ signal }) => economyAdminRepository.history(signal),
  })
}

export function useEconomyVersion(versionId: number | null) {
  return useQuery({
    queryKey: qk.admin.economyVersion(versionId ?? 0),
    queryFn: ({ signal }) => economyAdminRepository.version(versionId!, signal),
    enabled: versionId !== null,
  })
}

export function useEconomyMetrics(months: number) {
  return useQuery({
    queryKey: qk.admin.economyMetrics(months),
    queryFn: ({ signal }) => economyAdminRepository.metrics(months, signal),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Saving and restoring both answer with the config now in force, which goes
 * straight into the cache; the history and the dashboard (it shows the
 * version number) are refetched.
 */
function useEconomyWrite<TInput>(mutationFn: (input: TInput) => Promise<EconomyConfig>, success: string, failure: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (config) => {
      queryClient.setQueryData(qk.admin.economy, config)
      queryClient.invalidateQueries({ queryKey: qk.admin.economyHistory })
      queryClient.invalidateQueries({ queryKey: ["admin", "economy", "metrics"] })
      toast.success(success)
    },
    onError: (error) => toast.error(specificMessage(error) ?? failure),
  })
}

export function useSaveEconomy() {
  return useEconomyWrite(
    ({ config, note }: { config: EconomyConfig; note?: string }) => economyAdminRepository.save({ config, note }),
    "Economía guardada. Rige desde ahora.",
    "No pudimos guardar la economía",
  )
}

export function useRestoreEconomy() {
  return useEconomyWrite(
    (versionId: number) => economyAdminRepository.restore(versionId),
    "Versión restaurada. Rige desde ahora.",
    "No pudimos restaurar la versión",
  )
}

export function useWalletSearch(search: string) {
  return useQuery({
    queryKey: qk.admin.wallets(search),
    queryFn: ({ signal }) => economyAdminRepository.searchWallets(search, signal),
    placeholderData: keepPreviousData,
  })
}

export function useWalletHistory(studentId: number | null, page: number) {
  return useQuery({
    queryKey: qk.admin.walletHistory(studentId ?? 0, page),
    queryFn: ({ signal }) => economyAdminRepository.walletHistory(studentId!, page, signal),
    enabled: studentId !== null,
    placeholderData: keepPreviousData,
  })
}

export function useAdjustWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, delta, reason }: { studentId: number; delta: number; reason: string }) =>
      economyAdminRepository.adjust(studentId, { delta, reason }),
    onSuccess: (wallet) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "wallets"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "wallet-history"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "economy", "metrics"] })
      toast.success(`Ajuste aplicado. Saldo nuevo: ${wallet.balance} repes`)
    },
    onError: (error) => toast.error(specificMessage(error) ?? "No pudimos aplicar el ajuste"),
  })
}

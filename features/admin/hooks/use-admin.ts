"use client"

import { useMemo } from "react"

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { nextPageParam } from "@/core/http/pagination"
import { qk } from "@/core/http/query-keys"
import { userMessage } from "@/core/http/user-message"
import type { BrandStatus } from "@/features/brand/dto/brand.dto"

import { adminRepository } from "../api/admin.repository"
import type { AdminBrand } from "../model/admin.model"

/**
 * Comercios del panel de administración, paginados.
 *
 * Mismo caso que `useChallenges`: el endpoint y el repositorio siempre paginaron,
 * pero el hook llamaba a `brands()` sin params y el backend devolvía la página 0.
 * El listado mostraba los primeros ~20 comercios y no había forma de ver el resto.
 */
export function useAdminBrands() {
  const query = useInfiniteQuery({
    queryKey: qk.admin.brands,
    queryFn: ({ pageParam, signal }) => adminRepository.brands(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
  })

  const items = useMemo<AdminBrand[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )

  return {
    items,
    totalItems: query.data?.pages[0]?.totalItems ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  }
}

/**
 * Suspender o reactivar invalida también `challenges`.
 *
 * Un comercio suspendido desaparece del catálogo con todos sus desafíos, así que
 * cualquier lista de desafíos abierta en otra pestaña está mostrando algo que ya
 * no es cierto.
 */
export function useSetBrandStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ brandId, status }: { brandId: number; status: BrandStatus }) =>
      adminRepository.setBrandStatus(brandId, status),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all })
      queryClient.invalidateQueries({ queryKey: qk.challenges.all })
      toast.success(
        brand.status === "SUSPENDED"
          ? "Comercio suspendido. Sus desafíos ya no aparecen en la app."
          : "Comercio reactivado.",
      )
    },
    onError: (error) => toast.error(userMessage(error, "save")),
  })
}

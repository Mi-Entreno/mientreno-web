"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { specificMessage } from "@/core/http/user-message"
import { membershipAdminRepository } from "../api/membership-admin.repository"
import type {
  AdminEntitlementRequestDTO,
  AdminPlanUpdateDTO,
  AdminPriceRequestDTO,
  AdminStoreProductsRequestDTO,
} from "../dto/membership-admin.dto"
import type { MembershipPlan, MembershipStatus } from "../model/membership-admin.model"

export function useAdminMembershipPlans() {
  return useQuery({
    queryKey: qk.admin.membershipPlans,
    queryFn: ({ signal }) => membershipAdminRepository.plans(signal),
  })
}

/**
 * Every plan mutation answers with the updated plan, which is swapped into the
 * cached list in place — no refetch of the whole catalogue per toggle. The
 * trainer-side membership cache is invalidated too: an admin editing their own
 * audience's plan should see it.
 */
function usePlanMutation<TInput>(
  mutationFn: (input: TInput) => Promise<MembershipPlan>,
  success: string,
  failure: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (plan) => {
      queryClient.setQueryData<MembershipPlan[]>(qk.admin.membershipPlans, (plans) =>
        plans?.map((existing) => (existing.id === plan.id ? plan : existing)),
      )
      queryClient.invalidateQueries({ queryKey: qk.membership.all })
      toast.success(success)
    },
    onError: (error) => toast.error(specificMessage(error) ?? failure),
  })
}

export function useUpdatePlan() {
  return usePlanMutation(
    ({ planId, patch }: { planId: number; patch: AdminPlanUpdateDTO }) =>
      membershipAdminRepository.updatePlan(planId, patch),
    "Plan actualizado",
    "No pudimos actualizar el plan",
  )
}

export function useAddPrice() {
  return usePlanMutation(
    ({ planId, price }: { planId: number; price: AdminPriceRequestDTO }) =>
      membershipAdminRepository.addPrice(planId, price),
    "Precio nuevo vigente. Quien ya pagaba conserva el suyo.",
    "No pudimos cambiar el precio",
  )
}

export function useSetStoreProducts() {
  return usePlanMutation(
    ({ priceId, body }: { priceId: number; body: AdminStoreProductsRequestDTO }) =>
      membershipAdminRepository.setStoreProducts(priceId, body),
    "Productos de tienda guardados",
    "No pudimos guardar los productos de tienda",
  )
}

export function useSetEntitlement() {
  return usePlanMutation(
    ({ planId, featureCode, body }: { planId: number; featureCode: string; body: AdminEntitlementRequestDTO }) =>
      membershipAdminRepository.setEntitlement(planId, featureCode, body),
    "Beneficio actualizado. Rige desde ahora.",
    "No pudimos actualizar el beneficio",
  )
}

export function useRemoveEntitlement() {
  return usePlanMutation(
    ({ planId, featureCode }: { planId: number; featureCode: string }) =>
      membershipAdminRepository.removeEntitlement(planId, featureCode),
    "El plan vuelve al valor por defecto",
    "No pudimos quitar el beneficio",
  )
}

export function useAdminMemberships(status: MembershipStatus | null, page: number) {
  return useQuery({
    queryKey: qk.admin.memberships(status, page),
    queryFn: ({ signal }) => membershipAdminRepository.memberships(status, page, signal),
    placeholderData: keepPreviousData,
  })
}

export function useMembershipMetrics() {
  return useQuery({
    queryKey: qk.admin.membershipMetrics,
    queryFn: ({ signal }) => membershipAdminRepository.metrics(signal),
    staleTime: 60_000,
  })
}

export function useGrantMembership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: membershipAdminRepository.grant,
    onSuccess: (membership) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all })
      toast.success(`Plan ${membership.planCode} otorgado a ${membership.userEmail ?? `#${membership.userId}`}`)
    },
    onError: (error) => toast.error(specificMessage(error) ?? "No pudimos otorgar el plan"),
  })
}

export function useReconcileMembership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (membershipId: number) => membershipAdminRepository.reconcile(membershipId),
    onSuccess: (outcomes) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all })
      toast.success(outcomes.length ? outcomes.join(" · ") : "Sin cambios")
    },
    onError: (error) => toast.error(specificMessage(error) ?? "No pudimos consultar a Mercado Pago"),
  })
}

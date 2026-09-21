"use client"

import { useMemo } from "react"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { nextPageParam } from "@/core/http/pagination"
import { userMessage, type FailureContext } from "@/core/http/user-message"

import { challengesRepository } from "../api/challenges.repository"
import type { ChallengeStatus, SaveChallengeInput } from "../dto/challenge.dto"
import type { BrandChallenge, ChallengeParticipant } from "../model/challenge.model"

/**
 * Desafíos del comercio, paginados de verdad.
 *
 * Antes llamaba a `list(status)` sin params, así que el repositorio no mandaba
 * `page` ni `size` y el backend devolvía la página 0: sólo se veían los primeros
 * ~20 desafíos y no había forma de llegar al resto. El endpoint siempre paginó y
 * el repositorio siempre aceptó `PageParams` — lo que faltaba era usarlos.
 */
export function useChallenges(status?: ChallengeStatus) {
  const query = useInfiniteQuery({
    queryKey: qk.challenges.list(status),
    queryFn: ({ pageParam, signal }) => challengesRepository.list(status, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
  })

  const items = useMemo<BrandChallenge[]>(
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

export function useChallenge(id: number) {
  return useQuery({
    queryKey: qk.challenges.detail(id),
    queryFn: () => challengesRepository.detail(id),
    enabled: Number.isFinite(id),
  })
}

/**
 * Los alumnos anotados en un desafío.
 *
 * Paginado desde el arranque —y no una sola página como quedó `useRedemptions`—
 * porque acá el largo de la lista lo decide el éxito del desafío: el que
 * funciona es justamente el que no entra en veinte filas. `enabled` existe para
 * que el panel no pida los participantes hasta que alguien abre la ficha.
 */
export function useChallengeParticipants(id: number, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: qk.challenges.participants(id),
    queryFn: ({ pageParam, signal }) =>
      challengesRepository.participants(id, { page: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled: enabled && Number.isFinite(id),
  })

  const items = useMemo<ChallengeParticipant[]>(
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
 * Toda mutación invalida el namespace entero de desafíos.
 *
 * Claves más finas se equivocarían más seguido de lo que ahorrarían: publicar
 * mueve un desafío entre dos listas filtradas, cancelar cambia también sus
 * participantes, y entregar un canje toca la bandeja y el detalle. El panel de
 * un comercio tiene unas pocas filas, así que un refetch no cuesta nada al lado
 * de mostrar un estado viejo.
 */
function useChallengeMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  successMessage: (result: TResult) => string,
  context: FailureContext,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.challenges.all })
      toast.success(successMessage(result))
    },
    onError: (error) => toast.error(userMessage(error, context)),
  })
}

export function useCreateChallenge() {
  return useChallengeMutation(
    (input: SaveChallengeInput) => challengesRepository.create(input),
    () => "Desafío creado como borrador. Revisalo y publicalo.",
    "save",
  )
}

export function useUpdateChallenge() {
  return useChallengeMutation(
    ({ id, input }: { id: number; input: SaveChallengeInput }) => challengesRepository.update(id, input),
    () => "Desafío guardado.",
    "save",
  )
}

export function usePublishChallenge() {
  return useChallengeMutation(
    (id: number) => challengesRepository.publish(id),
    () => "Publicado. Los alumnos ya pueden aceptarlo.",
    "save",
  )
}

export function usePauseChallenge() {
  return useChallengeMutation(
    ({ id, paused }: { id: number; paused: boolean }) =>
      paused ? challengesRepository.pause(id) : challengesRepository.resume(id),
    (challenge) =>
      challenge.status === "PAUSED"
        ? "Pausado. Los que ya lo aceptaron siguen su desafío."
        : "Desafío reanudado.",
    "save",
  )
}

export function useCancelChallenge() {
  return useChallengeMutation(
    ({ id, reason }: { id: number; reason?: string }) => challengesRepository.cancel(id, reason),
    () => "Desafío cancelado. Les avisamos a los alumnos que lo tenían en curso.",
    "save",
  )
}

export function useAddStock() {
  return useChallengeMutation(
    ({ id, units }: { id: number; units: number }) => challengesRepository.addStock(id, units),
    (challenge) => `Ahora hay ${challenge.reward.stock} unidades.`,
    "save",
  )
}

export function useUploadChallengeImage() {
  return useChallengeMutation(
    ({ id, file, target }: { id: number; file: File; target: "challenge" | "reward" }) =>
      challengesRepository.uploadImage(id, file, target),
    () => "Imagen actualizada.",
    "upload",
  )
}

export function useRedemptions(status?: "PENDING" | "DELIVERED" | "ALL") {
  return useQuery({
    queryKey: [...qk.challenges.redemptions, status ?? "PENDING"],
    queryFn: () => challengesRepository.redemptions(status),
  })
}

/**
 * Validación del código en el mostrador.
 *
 * Es una mutación y no una query aunque sólo lea: la dispara el empleado al
 * tipear un código, no la carga de una pantalla, y una query cachearía el
 * resultado de un código ajeno al siguiente cliente.
 */
export function useValidateRedemption() {
  return useMutation({
    mutationFn: (code: string) => challengesRepository.validateCode(code),
    onError: (error) => toast.error(userMessage(error, "load")),
  })
}

export function useMarkDelivered() {
  return useChallengeMutation(
    (participationId: number) => challengesRepository.markDelivered(participationId),
    () => "Entregado.",
    "save",
  )
}

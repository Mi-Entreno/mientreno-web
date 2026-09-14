"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { userMessage, type FailureContext } from "@/core/http/user-message"

import { challengesRepository } from "../api/challenges.repository"
import type { ChallengeStatus, SaveChallengeInput } from "../dto/challenge.dto"

export function useChallenges(status?: ChallengeStatus) {
  return useQuery({
    queryKey: qk.challenges.list(status),
    queryFn: () => challengesRepository.list(status),
  })
}

export function useChallenge(id: number) {
  return useQuery({
    queryKey: qk.challenges.detail(id),
    queryFn: () => challengesRepository.detail(id),
    enabled: Number.isFinite(id),
  })
}

export function useChallengeParticipants(id: number, enabled = true) {
  return useQuery({
    queryKey: qk.challenges.participants(id),
    queryFn: () => challengesRepository.participants(id),
    enabled: enabled && Number.isFinite(id),
  })
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

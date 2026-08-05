"use client"

import { useQuery } from "@tanstack/react-query"

import { qk } from "@/core/http/query-keys"
import { workoutSessionsRepository } from "../api/workout-sessions.repository"

export function useWorkoutSession(sessionId: number | null) {
  return useQuery({
    queryKey: qk.workoutSessions.detail(sessionId ?? 0),
    queryFn: () => workoutSessionsRepository.getById(sessionId as number),
    enabled: sessionId !== null,
    staleTime: 60_000,
  })
}

import { apiFetch } from "@/core/http/client"

import type { WorkoutSessionDetailResponseDTO } from "../dto/workout-session.dto"
import { toWorkoutSession } from "../mappers/workout-session.mapper"
import type { WorkoutSession } from "../model/workout-session.model"

export const workoutSessionsRepository = {
  /**
   * `GET /api/workout-sessions/{sessionId}`.
   *
   * The only session endpoint a trainer may call. `GET /my` is
   * `@PreAuthorize("hasRole('STUDENT')")`, and `IWorkoutSessionRepository` has
   * no query by trainer — so **nothing lists a student's sessions for their
   * trainer**. This reads a session fine once the id is known; discovering the
   * id needs a backend change (`docs/BACKEND_CHANGE_REQUEST.md`, petición 5).
   */
  async getById(sessionId: number): Promise<WorkoutSession> {
    return toWorkoutSession(
      await apiFetch<WorkoutSessionDetailResponseDTO>(`/api/workout-sessions/${sessionId}`),
    )
  },
}

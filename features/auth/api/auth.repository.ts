import { ApiError, networkError, normalizeError, readErrorBody } from "@/core/http/errors"

import type { MessageResponse, RegisterResult } from "../dto/auth.dto"

/**
 * The unauthenticated half of the auth API.
 *
 * These endpoints are `permitAll` upstream but still go through our own BFF
 * handlers rather than `/api/backend/*`, which requires a session by design.
 */
async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (cause) {
    throw new ApiError(networkError(cause))
  }

  if (!response.ok) {
    throw new ApiError(normalizeError(response.status, await readErrorBody(response)))
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export interface RegisterInput {
  email: string
  password: string
  phone: string
  /**
   * BFF route that creates the account.
   *
   * Comes from `AudienceCopy.registerEndpoint`, which is a closed set of two
   * literals — not something a form field can steer. The alternative was one
   * handler taking a role parameter, which would mean deriving a backend path
   * from client input.
   */
  endpoint?: string
}

export const authRepository = {
  /**
   * Registers a trainer or a merchant. Answers `AuthResponseDTO.noToken(...)`
   * upstream — no session is created, so the user still has to verify and then
   * sign in.
   */
  register(input: RegisterInput): Promise<RegisterResult> {
    return post<RegisterResult>(input.endpoint ?? "/auth/trainer/register", {
      email: input.email.trim(),
      password: input.password,
      phone: input.phone.trim() || null,
    })
  },

  verifyOtp(email: string, code: string): Promise<MessageResponse> {
    return post<MessageResponse>("/auth/public/verify-otp", { email: email.trim(), code })
  },

  /** 204 on success; 429 with a "wait N seconds" message inside the cooldown. */
  resendOtp(email: string): Promise<void> {
    return post<void>("/auth/public/resend-otp", { email: email.trim() })
  },

  /**
   * Always succeeds for a well-formed email, even an unknown one:
   * `PasswordRecoveryService.requestPasswordReset` returns silently when no
   * user matches, so the API cannot be used to enumerate accounts. The UI must
   * word its confirmation accordingly.
   */
  requestPasswordReset(email: string): Promise<MessageResponse> {
    return post<MessageResponse>("/auth/public/password-reset-request", {
      email: email.trim(),
      method: "email",
    })
  },

  verifyResetCode(email: string, code: string): Promise<MessageResponse> {
    return post<MessageResponse>("/auth/public/password-reset-verify", {
      email: email.trim(),
      code,
    })
  },

  confirmPasswordReset(email: string, code: string, newPassword: string): Promise<MessageResponse> {
    return post<MessageResponse>("/auth/public/password-reset-confirm", {
      email: email.trim(),
      code,
      newPassword,
    })
  },
}

import { ApiError, normalizeError, readErrorBody } from "@/core/http/errors"

export const accountRepository = {
  /**
   * Soft-deletes the account and ends the session.
   *
   * Routed through `/api/account` (our handler) rather than the generic proxy
   * because the backend revokes every refresh token, so the cookie has to be
   * cleared in the same response.
   */
  async remove(): Promise<void> {
    const response = await fetch("/api/account", {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      throw new ApiError(normalizeError(response.status, await readErrorBody(response)))
    }
  },
}

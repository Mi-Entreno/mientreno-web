"use client"

import { apiFetch } from "@/core/http/client"

/**
 * Product events (the Premium funnel). Fire and forget: tracking can never
 * block or break what the user is doing, so the response is not awaited and
 * any failure is swallowed.
 *
 * The backend accepts a closed list of names. What only the server knows (a
 * 402, a Premium feature used) it records itself; it is not sent from here.
 */
export type ClientEvent = "PAYWALL_VIEWED" | "PREMIUM_PAGE_OPENED"

export function track(name: ClientEvent, properties?: Record<string, string>): void {
  apiFetch("/api/analytics/events", { method: "POST", body: { name, platform: "web", properties } }).catch(
    () => undefined,
  )
}

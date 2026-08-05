"use client"

import { useCallback, useEffect, useState } from "react"

import { OTP_RESEND_COOLDOWN_SECONDS } from "../dto/auth.dto"

/**
 * Countdown for the resend-code button.
 *
 * `EmailVerificationService.sendVerificationCode` rejects a resend inside
 * `email-verification.resend-cooldown-seconds` (60 by default) with a 429 whose
 * message names the exact remaining seconds. `startFromMessage` reads that back
 * so the local timer matches the server rather than guessing — the two drift
 * when a code was requested from another device.
 *
 * Tracks a deadline and recomputes from the clock rather than decrementing a
 * counter once per second. Chained timers drift, and browsers throttle them in
 * background tabs, so a decrementing counter would show far too much time
 * remaining after the user switches away and back.
 */
export function useResendCooldown() {
  const [deadline, setDeadline] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (deadline === null) return

    function tick() {
      const remaining = Math.max(0, Math.ceil((deadline! - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) setDeadline(null)
    }

    tick()
    // Sub-second so the displayed value never lags a full second behind.
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [deadline])

  const start = useCallback((seconds = OTP_RESEND_COOLDOWN_SECONDS) => {
    const safe = Math.max(0, Math.ceil(seconds))
    if (safe === 0) {
      setDeadline(null)
      setSecondsLeft(0)
      return
    }
    setSecondsLeft(safe)
    setDeadline(Date.now() + safe * 1000)
  }, [])

  /** Reads "Debés esperar 43 segundos…" out of a 429 body. */
  const startFromMessage = useCallback(
    (message: string) => {
      const match = /(\d+)\s*segundos?/i.exec(message)
      start(match ? Number(match[1]) : OTP_RESEND_COOLDOWN_SECONDS)
    },
    [start],
  )

  return { secondsLeft, isCoolingDown: secondsLeft > 0, start, startFromMessage }
}

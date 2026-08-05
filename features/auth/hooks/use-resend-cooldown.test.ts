import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useResendCooldown } from "./use-resend-cooldown"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useResendCooldown", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useResendCooldown())
    expect(result.current.isCoolingDown).toBe(false)
  })

  it("counts down from the backend default", () => {
    // email-verification.resend-cooldown-seconds defaults to 60.
    const { result } = renderHook(() => useResendCooldown())

    act(() => result.current.start())
    expect(result.current.secondsLeft).toBe(60)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.secondsLeft).toBe(57)
  })

  it("reaches zero and stops cooling down", () => {
    const { result } = renderHook(() => useResendCooldown())

    act(() => result.current.start(2))
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.secondsLeft).toBe(0)
    expect(result.current.isCoolingDown).toBe(false)
  })

  it("catches up after a gap instead of drifting", () => {
    // Browsers throttle timers in background tabs. A counter that decrements
    // once per tick would still show ~55s after the user comes back; deriving
    // the value from the deadline reports the truth on the next tick.
    const { result } = renderHook(() => useResendCooldown())

    act(() => result.current.start(60))
    act(() => {
      vi.advanceTimersByTime(50_000)
    })

    expect(result.current.secondsLeft).toBe(10)
  })

  it("reads the remaining seconds out of the 429 message", () => {
    // The backend answers: "Debés esperar 43 segundos antes de solicitar un
    // nuevo código". Using its number keeps the timer in sync with the server,
    // which matters when a code was requested from another device.
    const { result } = renderHook(() => useResendCooldown())

    act(() =>
      result.current.startFromMessage(
        "Debés esperar 43 segundos antes de solicitar un nuevo código",
      ),
    )

    expect(result.current.secondsLeft).toBe(43)
  })

  it("handles the singular form", () => {
    const { result } = renderHook(() => useResendCooldown())
    act(() => result.current.startFromMessage("Debés esperar 1 segundo"))
    expect(result.current.secondsLeft).toBe(1)
  })

  it("falls back to the default when the message has no number", () => {
    const { result } = renderHook(() => useResendCooldown())
    act(() => result.current.startFromMessage("Demasiadas solicitudes"))
    expect(result.current.secondsLeft).toBe(60)
  })
})

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PremiumBadge } from "./premium-badge"

const state = vi.hoisted(() => ({ enabled: true, planName: "Pro" as string | null }))

vi.mock("../hooks/use-membership", () => ({
  useFeature: () => ({ feature: { enabled: state.enabled } }),
  useEntitlements: () => ({ data: state.planName ? { planName: state.planName } : undefined }),
}))

describe("PremiumBadge", () => {
  it("shows the plan name when the plan includes the badge", () => {
    state.enabled = true
    state.planName = "Pro"
    render(<PremiumBadge />)
    expect(screen.getByText("Pro")).toBeInTheDocument()
  })

  it("renders nothing on the free plan", () => {
    state.enabled = false
    state.planName = "Gratis"
    const { container } = render(<PremiumBadge />)
    expect(container).toBeEmptyDOMElement()
  })
})

import { describe, expect, it } from "vitest"

import type { AdminChallenge, ChallengeRequirement } from "./admin.model"
import {
  CHALLENGE_STATUS_LABELS,
  describeMode,
  describeRequirement,
  hasGrantsLeft,
  isLive,
  METRIC_OPTIONS,
  notLiveReason,
} from "./challenge.model"

/** Mañana y ayer, para las pruebas de vigencia sin fechas fijas que caducan. */
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

const requirement = (overrides: Partial<ChallengeRequirement> = {}): ChallengeRequirement => ({
  id: 1,
  metric: "SETS_COMPLETED",
  label: "series",
  unit: "series",
  targetValue: 100,
  window: "LIFETIME",
  windowDays: null,
  ...overrides,
})

const challenge = (overrides: Partial<AdminChallenge> = {}): AdminChallenge => ({
  id: 900,
  name: "Racha de 7 días",
  description: null,
  prizeReps: 2,
  requirementMode: "ALL",
  requiredCount: null,
  active: true,
  validFrom: null,
  validTo: null,
  maxGrants: null,
  grantedCount: 0,
  editableRequirements: true,
  approvalStatus: "APPROVED",
  rejectionReason: null,
  // Desafío de la plataforma: es el único caso que el panel produce.
  brandId: null,
  brandName: null,
  requirements: [requirement()],
  updatedAt: "2026-09-01T10:00:00Z",
  ...overrides,
})

describe("isLive", () => {
  it("is true for a published, active challenge with room left", () => {
    expect(isLive(challenge())).toBe(true)
  })

  it("is false for a draft", () => {
    expect(isLive(challenge({ approvalStatus: "DRAFT" }))).toBe(false)
  })

  it("is false once paused", () => {
    expect(isLive(challenge({ active: false }))).toBe(false)
  })

  it("is false with the quota used up", () => {
    expect(isLive(challenge({ maxGrants: 5, grantedCount: 5 }))).toBe(false)
  })
})

describe("hasGrantsLeft", () => {
  it("is true without a quota — that is what null means", () => {
    expect(hasGrantsLeft(challenge({ maxGrants: null, grantedCount: 999 }))).toBe(true)
  })

  it("is true below the quota and false at it", () => {
    expect(hasGrantsLeft(challenge({ maxGrants: 5, grantedCount: 4 }))).toBe(true)
    expect(hasGrantsLeft(challenge({ maxGrants: 5, grantedCount: 5 }))).toBe(false)
  })
})

describe("notLiveReason", () => {
  it("is null when it really is winnable", () => {
    expect(notLiveReason(challenge())).toBeNull()
  })

  it("is null for a draft: the state pill already says so", () => {
    // Saying "paused" over a draft would be two answers to the same question.
    expect(notLiveReason(challenge({ approvalStatus: "DRAFT", active: false }))).toBeNull()
  })

  it("names the pause, the exhausted quota and the expired window", () => {
    expect(notLiveReason(challenge({ active: false }))).toBe("Pausado")
    expect(notLiveReason(challenge({ maxGrants: 1, grantedCount: 1 }))).toBe("Cupo agotado")
    expect(notLiveReason(challenge({ validTo: yesterday }))).toBe("Vigencia terminada")
    expect(notLiveReason(challenge({ validFrom: tomorrow }))).toBe("Todavía no empieza")
  })
})

describe("describeRequirement", () => {
  it("reads as an amount and a unit", () => {
    expect(describeRequirement(requirement())).toBe("100 series")
  })

  it("spells out the rolling window", () => {
    expect(
      describeRequirement(requirement({ window: "LAST_N_DAYS", windowDays: 30 })),
    ).toBe("100 series en los últimos 30 días")
  })

  it("spells out the window that starts with the challenge", () => {
    expect(describeRequirement(requirement({ window: "SINCE_CHALLENGE_START" }))).toBe(
      "100 series desde que empieza",
    )
  })

  it("groups thousands the way the locale does", () => {
    expect(describeRequirement(requirement({ targetValue: 10_000, unit: "kg" }))).toContain("10.000")
  })
})

describe("describeMode", () => {
  it("says 'the only one' when there is a single requirement", () => {
    expect(describeMode(challenge())).toBe("El único requisito")
  })

  it("counts them for ALL", () => {
    expect(describeMode(challenge({ requirements: [requirement(), requirement({ id: 2 })] }))).toBe(
      "Los 2",
    )
  })

  it("says any of them for ANY", () => {
    expect(
      describeMode(
        challenge({
          requirementMode: "ANY",
          requirements: [requirement(), requirement({ id: 2 })],
        }),
      ),
    ).toBe("Cualquiera de los 2")
  })

  it("says N of M, falling back to the total when N is missing", () => {
    const two = [requirement(), requirement({ id: 2 }), requirement({ id: 3 })]
    expect(describeMode(challenge({ requirementMode: "N_OF_M", requiredCount: 2, requirements: two })))
      .toBe("2 de 3")
    expect(describeMode(challenge({ requirementMode: "N_OF_M", requiredCount: null, requirements: two })))
      .toBe("3 de 3")
  })
})

describe("METRIC_OPTIONS", () => {
  it("has no duplicates: a repeated metric would be two identical <option>s", () => {
    const values = METRIC_OPTIONS.map((option) => option.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it("covers the nine metrics the backend evaluates", () => {
    // If this number changes, either a metric was added upstream and the select
    // never learned about it, or one was removed and this list points at nothing.
    expect(METRIC_OPTIONS).toHaveLength(9)
  })
})

describe("CHALLENGE_STATUS_LABELS", () => {
  it("maps the four states, though a challenge only reaches two of them", () => {
    // The type is shared with products, which do go through review. A leftover row
    // from when merchants loaded challenges must still render a label.
    expect(CHALLENGE_STATUS_LABELS.DRAFT).toBe("Borrador")
    expect(CHALLENGE_STATUS_LABELS.APPROVED).toBe("Publicado")
    expect(CHALLENGE_STATUS_LABELS.PENDING_APPROVAL).toBeTruthy()
    expect(CHALLENGE_STATUS_LABELS.REJECTED).toBeTruthy()
  })
})

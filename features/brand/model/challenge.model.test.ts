import { describe, expect, it } from "vitest"

import {
  describeMode,
  describeRequirement,
  hasGrantsLeft,
  isLive,
  notLiveReason,
  type BrandChallenge,
  type ChallengeRequirement,
} from "./challenge.model"

function requirement(overrides: Partial<ChallengeRequirement> = {}): ChallengeRequirement {
  return {
    id: 1,
    metric: "SETS_COMPLETED",
    label: "series",
    unit: "series",
    targetValue: 100,
    window: "LIFETIME",
    windowDays: null,
    ...overrides,
  }
}

function challenge(overrides: Partial<BrandChallenge> = {}): BrandChallenge {
  return {
    id: 900,
    name: "Constancia de acero",
    description: null,
    prizeReps: 50,
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
    requirements: [requirement()],
    ...overrides,
  }
}

describe("isLive / notLiveReason", () => {
  it("an approved, active challenge with room left is live", () => {
    expect(isLive(challenge())).toBe(true)
    expect(notLiveReason(challenge())).toBeNull()
  })

  it("a draft is not live and shows no reason: the state already says it", () => {
    const draft = challenge({ approvalStatus: "DRAFT" })
    expect(isLive(draft)).toBe(false)
    expect(notLiveReason(draft)).toBeNull()
  })

  it("paused and exhausted are the two cases worth explaining", () => {
    expect(notLiveReason(challenge({ active: false }))).toBe("Pausada por vos")
    expect(notLiveReason(challenge({ maxGrants: 5, grantedCount: 5 }))).toBe("Cupo agotado")
  })

  it("an expired validity is not winnable either", () => {
    expect(notLiveReason(challenge({ validTo: "2020-01-01" }))).toBe("Vigencia terminada")
    expect(notLiveReason(challenge({ validFrom: "2999-01-01" }))).toBe("Todavía no empieza")
  })

  it("no cap means there is always room", () => {
    expect(hasGrantsLeft(challenge({ maxGrants: null, grantedCount: 999 }))).toBe(true)
    expect(hasGrantsLeft(challenge({ maxGrants: 10, grantedCount: 9 }))).toBe(true)
    expect(hasGrantsLeft(challenge({ maxGrants: 10, grantedCount: 10 }))).toBe(false)
  })
})

describe("describeRequirement", () => {
  it("spells out the window, because a windowed number can go down", () => {
    expect(describeRequirement(requirement())).toBe("100 series")
    expect(
      describeRequirement(requirement({ window: "LAST_N_DAYS", windowDays: 30 })),
    ).toBe("100 series en los últimos 30 días")
    expect(describeRequirement(requirement({ window: "SINCE_CHALLENGE_START" }))).toBe(
      "100 series desde que empieza",
    )
  })

  it("formats large targets for a human", () => {
    expect(describeRequirement(requirement({ targetValue: 10000, unit: "kg" }))).toContain("10.000 kg")
  })
})

describe("describeMode", () => {
  it("says how many requirements are needed", () => {
    const two = [requirement(), requirement({ id: 2, metric: "VOLUME_KG" })]
    expect(describeMode(challenge({ requirements: two }))).toBe("Los 2")
    expect(describeMode(challenge({ requirementMode: "ANY", requirements: two }))).toBe(
      "Cualquiera de los 2",
    )
    expect(
      describeMode(challenge({ requirementMode: "N_OF_M", requiredCount: 1, requirements: two })),
    ).toBe("1 de 2")
  })

  it("a single requirement does not read as a plural", () => {
    expect(describeMode(challenge())).toBe("El único requisito")
  })
})
